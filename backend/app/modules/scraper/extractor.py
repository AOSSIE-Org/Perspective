"""
extractor.py
------------
Article content extraction with 5 progressive strategies.

Extraction order:
    1. Trafilatura           — fastest, best quality for open sites
    2. Newspaper3k           — good for news sites
    3. BeautifulSoup/Readability — raw HTML fallback
    4. Playwright (headless Chromium + stealth)
                             — handles JS-rendered & bot-protected sites
                               (The Guardian, NYT, FT, WaPo, etc.)
    5. AMP URL variants      — lightweight fallback for supported publishers

The Playwright strategy uses playwright-stealth to spoof browser fingerprints
and appears identical to a real Chrome user, bypassing Cloudflare and similar
bot-detection systems.
"""

import ipaddress
import json
import logging
import random
import socket
from typing import Optional
from urllib.parse import urlparse

import requests
import cloudscraper  # type: ignore
import trafilatura
from bs4 import BeautifulSoup
from newspaper import Article as NewspaperArticle
from readability import Document

from app.modules.scraper.cleaner import clean_extracted_text  # type: ignore

logger = logging.getLogger(__name__)

_MIN_CONTENT_LENGTH = 300  # characters

_USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64; rv:124.0) Gecko/20100101 Firefox/124.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:123.0) Gecko/20100101 Firefox/123.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
]


def _make_headers() -> dict:
    """Build realistic browser-like headers that bypass most anti-bot gates."""
    return {
        "User-Agent": random.choice(_USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Accept-Encoding": "gzip, deflate, br",
        "Referer": "https://www.google.com/",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "cross-site",
        "Cache-Control": "no-cache",
        # Pre-accept cookie consent banners (bypasses GDPR popups)
        "Cookie": "gdpr_consent=true; cookie_consent=accepted; euconsent=true",
    }


# ── SSRF guard ────────────────────────────────────────────────────────────────

# Cloud metadata IPs that must always be blocked (exact)
_BLOCKED_IPS = {
    "169.254.169.254",  # AWS / GCP / Azure IMDS
    "100.100.100.200",  # Alibaba Cloud metadata
    "fd00:ec2::254",    # AWS IPv6 IMDS
}


def _validate_url(url: str) -> None:
    """
    Enforce SSRF protection before any HTTP library touches the URL.

    Checks:
      1. Scheme must be http or https.
      2. Hostname must be present.
      3. Resolves the hostname to all IPs and rejects any that fall in:
         - Loopback           (127.0.0.0/8, ::1)
         - Private/RFC‑1918   (10/8, 172.16/12, 192.168/16, fc00::/7)
         - Link-local         (169.254.0.0/16, fe80::/10)
         - Cloud metadata IPs (169.254.169.254, 100.100.100.200, …)
         - Unspecified        (0.0.0.0/8, ::)

    Raises ValueError with a safe (non-leaking) message on any violation.
    """
    try:
        parsed = urlparse(url)
    except Exception:
        raise ValueError("Invalid URL.")

    if parsed.scheme not in ("http", "https"):
        raise ValueError("Only http and https URLs are permitted.")

    hostname = parsed.hostname
    if not hostname:
        raise ValueError("URL has no hostname.")

    # Resolve all addresses the hostname maps to
    try:
        infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror:
        raise ValueError("Could not resolve hostname.")

    for info in infos:
        raw_ip = str(info[4][0])  # address field is str at runtime; cast for type checker
        # Strip IPv6 zone id if present (e.g. "fe80::1%eth0")
        raw_ip = raw_ip.split("%")[0]
        try:
            addr = ipaddress.ip_address(raw_ip)
        except ValueError:
            raise ValueError("Unrecognised IP address format.")

        if str(addr) in _BLOCKED_IPS:
            raise ValueError("URL resolves to a blocked address.")

        if (
            addr.is_loopback
            or addr.is_private
            or addr.is_link_local
            or addr.is_unspecified
            or addr.is_reserved
        ):
            raise ValueError("URL resolves to a non-public address.")





def _amp_url(url: str) -> Optional[str]:
    """Return the AMP variant of a URL for publishers that support AMP."""
    if "theguardian.com" in url:
        return url.replace("www.theguardian.com", "amp.theguardian.com")
    if "washingtonpost.com" in url:
        return url.replace("www.washingtonpost.com", "amp.washingtonpost.com")
    return None


class Article_extractor:
    def __init__(self, url: str):
        _validate_url(url)   # SSRF guard — raises ValueError for unsafe targets
        self.url = url

    def _fetch_html(
        self, url: Optional[str] = None, extra_headers: Optional[dict] = None
    ) -> str:
        target = url or self.url
        headers = _make_headers()
        if extra_headers:
            headers.update(extra_headers)
        try:
            resp = requests.get(
                target, headers=headers, timeout=20, allow_redirects=True
            )
            if resp.status_code == 200 and len(resp.text) > 1000:
                return resp.text
            logger.debug(f"HTTP {resp.status_code} for {target}")
        except requests.RequestException as e:
            logger.warning(f"HTTP fetch failed for {target}: {e}")
        return ""

    def _is_valid(self, text: str) -> bool:
        """
        Validate that the extracted text passes the full cleaning and quality gate.
        This prevents stubs/paywalls (which may be >300 chars long) from short-circuiting
        the extraction chain and skipping the Playwright browser fallback.
        """
        if not text or len(text.strip()) < _MIN_CONTENT_LENGTH:
            return False
            
        cleaned = clean_extracted_text(text)
        return bool(cleaned and len(cleaned.strip()) > 0)

    def _extract_text_from_html(self, html: str) -> str:
        try:
            # First try the robust Document readability summary
            doc_summary = ""
            try:
                doc = Document(html)
                doc_summary = doc.summary()
            except Exception:
                pass
                
            soup = BeautifulSoup(doc_summary or html, "html.parser")
            
            # If doc.summary() failed or returned blank container, look directly for article bodies
            if not doc_summary or len(soup.get_text()) < 500:
                soup = BeautifulSoup(html, "html.parser")
                main_node = soup.find('main') or soup.find('article') or soup.find('div', class_='article-body') or soup
                soup = main_node
                
            paragraphs = [p.get_text(separator=" ").strip() for p in soup.find_all(["p", "h1", "h2", "h3"])]
            return "\n\n".join(p for p in paragraphs if len(p) > 20)
        except Exception as e:
            logger.debug(f"BS4 parse error: {e}")
            return ""

    # ── Strategy 1: Trafilatura ──────────────────────────────────────────
    def _try_trafilatura(self, url: Optional[str] = None) -> str:
        target = url or self.url
        try:
            downloaded = trafilatura.fetch_url(target)
            if not downloaded:
                return ""
            result = trafilatura.extract(
                downloaded,
                no_fallback=False,
                include_comments=False,
                include_tables=False,
                favor_precision=True,
                deduplicate=True,
                output_format="json",
            )
            if result:
                parsed = json.loads(result)
                text = parsed.get("text", "")
                if self._is_valid(text):
                    logger.debug(f"Trafilatura OK for {target}")
                    return text
        except Exception as e:
            logger.debug(f"Trafilatura error: {e}")
        return ""

    # ── Strategy 2: Newspaper3k ──────────────────────────────────────────
    def _try_newspaper(self, url: Optional[str] = None) -> str:
        target = url or self.url
        try:
            art = NewspaperArticle(
                target,
                browser_user_agent=random.choice(_USER_AGENTS),
                request_timeout=20,
                fetch_images=False,
            )
            art.download()
            art.parse()
            text = art.text or ""
            if self._is_valid(text):
                logger.debug(f"Newspaper3k OK for {target}")
                return text
        except Exception as e:
            logger.debug(f"Newspaper3k error: {e}")
        return ""

    # ── Strategy 3: BS4 + Readability ────────────────────────────────────
    def _try_bs4(self, url: Optional[str] = None) -> str:
        html = self._fetch_html(url)
        if not html:
            return ""
        text = self._extract_text_from_html(html)
        if self._is_valid(text):
            logger.debug(f"BS4 OK for {(url or self.url)}")
            return text
        return ""

    # ── Strategy 3.5: Cloudscraper (Bypasses Cloudflare/Nature) ──
    def _try_cloudscraper(self, url: Optional[str] = None) -> str:
        target = url or self.url
        try:
            scraper = cloudscraper.create_scraper(
                browser={
                    'browser': 'chrome',
                    'platform': 'windows',
                    'mobile': False
                }
            )
            resp = scraper.get(target, timeout=20, allow_redirects=True)
            if resp.status_code == 200 and len(resp.text) > 1000:
                html = resp.text
                text = self._extract_text_from_html(html)
                if self._is_valid(text):
                    logger.debug(f"cloudscraper OK for {target}")
                    return text
        except Exception as e:
            logger.debug(f"cloudscraper error: {e}")
        return ""

    # ── Strategy 4: Playwright headless Chromium + stealth ───────────────
    def _try_playwright(self) -> str:
        """
        Launches a real headless Chromium browser with stealth patches.
        Bypasses:
          - Cloudflare Bot Management (The Guardian, FT)
          - JavaScript-rendered paywalls
          - Cookie consent walls
          - navigator.webdriver fingerprint detection

        Falls back gracefully if playwright is not installed.
        """
        try:
            from playwright.sync_api import sync_playwright, TimeoutError as PWTimeout
        except ImportError:
            logger.debug("playwright not installed — skipping browser strategy")
            return ""

        try:
            # Import stealth patcher — gracefully skip if missing
            try:
                from playwright_stealth import Stealth
            except ImportError:
                Stealth = None
                logger.debug(
                    "playwright-stealth not installed — running without stealth"
                )

            ua = random.choice(_USER_AGENTS)

            with sync_playwright() as p:
                browser = p.chromium.launch(
                    headless=True,
                    args=[
                        "--no-sandbox",
                        "--disable-setuid-sandbox",
                        "--disable-blink-features=AutomationControlled",
                        "--disable-dev-shm-usage",
                        "--no-first-run",
                        "--no-default-browser-check",
                        "--disable-infobars",
                    ],
                )
                context = browser.new_context(
                    user_agent=ua,
                    viewport={"width": 1366, "height": 768},
                    locale="en-US",
                    timezone_id="America/New_York",
                    # Pretend to be a real user who came from Google
                    extra_http_headers={
                        "Referer": "https://www.google.com/",
                        "Accept-Language": "en-US,en;q=0.9",
                    },
                )

                page = context.new_page()

                # Apply stealth patches (removes webdriver fingerprint)
                if Stealth is not None:
                    s = Stealth()
                    s.apply_stealth_sync(page)

                try:
                    page.goto(
                        self.url,
                        wait_until="domcontentloaded",
                        timeout=30_000,
                    )
                    # Brief realistic pause — humans don't load instantly
                    page.wait_for_timeout(2500)

                    # Auto-dismiss common cookie consent banners
                    for selector in [
                        "button[id*='accept']",
                        "button[class*='accept']",
                        "button[aria-label*='Accept']",
                        "[data-testid*='accept']",
                        ".sp-agree-button",
                        "#onetrust-accept-btn-handler",
                    ]:
                        try:
                            btn = page.locator(selector).first
                            if btn.is_visible(timeout=1000):
                                btn.click()
                                page.wait_for_timeout(800)
                                break
                        except Exception:
                            pass

                    html = page.content()

                except PWTimeout:
                    logger.warning(f"Playwright timed out on {self.url}")
                    html = page.content()  # grab whatever loaded

                finally:
                    browser.close()

            if not html:
                return ""

            # Try trafilatura on the fully-rendered HTML first
            text = trafilatura.extract(
                html,
                no_fallback=False,
                include_comments=False,
                include_tables=False,
                favor_precision=True,
                deduplicate=True,
            )
            if text and self._is_valid(text):
                logger.info(
                    f"Playwright+trafilatura OK: {len(text)} chars from {self.url}"
                )
                return text

            # BS4 fallback on rendered HTML
            text = self._extract_text_from_html(html)
            if self._is_valid(text):
                logger.info(
                    f"Playwright+BS4 OK: {len(text)} chars from {self.url}"
                )
                return text

        except Exception as e:
            logger.warning(f"Playwright strategy error: {e}")

        return ""

    # ── Strategy 5: AMP URL ──────────────────────────────────────────────
    def _try_amp(self) -> str:
        amp = _amp_url(self.url)
        if not amp or amp == self.url:
            return ""
        # Validate the derived AMP URL before passing it to any strategy
        try:
            _validate_url(amp)
        except ValueError as exc:
            logger.warning(f"AMP URL failed SSRF check: {exc}")
            return ""
        logger.debug(f"Trying AMP URL: {amp}")
        for attempt in [self._try_trafilatura, self._try_newspaper, self._try_bs4]:
            text = attempt(amp)
            if text:
                return text
        return ""

    # ── Orchestrator ─────────────────────────────────────────────────────
    def extract(self) -> dict:
        strategies = [
            ("trafilatura", self._try_trafilatura),
            ("newspaper3k", self._try_newspaper),
            ("bs4", self._try_bs4),
            ("cloudscraper", self._try_cloudscraper),  # ← new: handles Cloudflare bot walls
            ("playwright", self._try_playwright),  # ← new: handles JS render
            ("amp_url", self._try_amp),
        ]

        for name, fn in strategies:
            try:
                text = fn()
                if self._is_valid(text):
                    logger.info(
                        f"[{name}] extracted {len(text)} chars from {self.url}"
                    )
                    return {
                        "url": self.url,
                        "text": text,
                        "title": "",
                        "extractor": name,
                    }
            except Exception as e:
                logger.warning(f"Strategy [{name}] raised: {e}")

        logger.error(f"All 5 extraction strategies failed for: {self.url}")
        return {
            "url": self.url,
            "text": "",
            "title": "",
            "error": "Failed to extract article.",
        }
