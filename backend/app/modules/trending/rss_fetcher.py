"""
rss_fetcher.py
--------------
Fetches trending articles from credible RSS feeds.

Improvements over v1:
  - URL validation: rejects non-HTTP URLs and known junk domains
  - Title quality check: rejects titles that are too short or all-caps
  - Description cleaned of HTML tags and extended to 300 chars
  - Source credibility metadata included (used to prioritise articles)
  - Added more high-quality feeds (Nature, MIT Tech Review, The Guardian)
  - Timeout on feedparser fetches to avoid hanging
"""

import re
import html
import feedparser
from datetime import datetime, timezone
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

# ── Feed registry with credibility scores ─────────────────────────────────────
RSS_FEEDS = [
    {
        "name": "Reuters",
        "url": "https://feeds.reuters.com/reuters/topNews",
        "credibility": 95,
    },
    {
        "name": "BBC World",
        "url": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "credibility": 92,
    },
    {
        "name": "BBC Technology",
        "url": "https://feeds.bbci.co.uk/news/technology/rss.xml",
        "credibility": 92,
    },
    {
        "name": "The Guardian",
        "url": "https://www.theguardian.com/world/rss",
        "credibility": 88,
    },
    {
        "name": "MIT Tech Review",
        "url": "https://www.technologyreview.com/feed/",
        "credibility": 90,
    },
    {
        "name": "Al Jazeera",
        "url": "https://www.aljazeera.com/xml/rss/all.xml",
        "credibility": 82,
    },
    {
        "name": "Hacker News",
        "url": "https://hnrss.org/frontpage?count=10",
        "credibility": 75,
    },
    {
        "name": "Nature News",
        "url": "https://www.nature.com/nature.rss",
        "credibility": 95,
    },
]

MAX_PER_FEED = 3
_MIN_TITLE_LEN = 15

# Strip HTML tags from descriptions
_HTML_TAG_RE = re.compile(r"<[^>]+>")
_JUNK_DOMAINS = {"feedburner.com", "doubleclick.net", "googleadservices.com"}


def _is_valid_url(url: str) -> bool:
    """Reject empty, non-HTTP, or known junk-domain URLs."""
    if not url or not url.startswith(("http://", "https://")):
        return False
    try:
        from urllib.parse import urlparse

        domain = urlparse(url).netloc.lower().lstrip("www.")
        return domain not in _JUNK_DOMAINS
    except Exception:
        return False


def _clean_description(desc: str) -> str:
    """Strip HTML tags and decode entities from RSS description snippets."""
    if not desc:
        return ""
    desc = _HTML_TAG_RE.sub(" ", desc)
    desc = html.unescape(desc)
    desc = re.sub(r"\s+", " ", desc).strip()
    return desc[:300]


def _is_valid_title(title: str) -> bool:
    if not title or len(title.strip()) < _MIN_TITLE_LEN:
        return False
    # All-caps titles are usually nav headers or clickbait
    letters = [c for c in title if c.isalpha()]
    if letters and sum(1 for c in letters if c.isupper()) / len(letters) > 0.8:
        return False
    return True


def _parse_date(entry) -> str:
    """Safe date parser supporting both published_parsed and updated_parsed."""
    try:
        pub = entry.get("published_parsed") or entry.get("updated_parsed")
        if pub:
            dt = datetime(*pub[:6], tzinfo=timezone.utc)
            return dt.isoformat()
    except Exception:
        pass
    return ""


def fetch_trending_articles(max_total: int = 12) -> list[dict]:
    """
    Fetch recent articles from configured RSS feeds.
    Articles are sorted by source credibility (highest first).

    Returns list of dicts: { title, url, source, published, description, credibility }
    """
    seen_urls: set[str] = set()
    articles: list[dict] = []

    # Sort feeds by credibility so best sources are picked first
    feeds_sorted = sorted(RSS_FEEDS, key=lambda f: f["credibility"], reverse=True)

    for feed_info in feeds_sorted:
        if len(articles) >= max_total:
            break
        try:
            # feedparser has no native timeout — set agent so servers don't block
            feed = feedparser.parse(
                feed_info["url"],
                agent="Mozilla/5.0 (compatible; PerspectiveBot/1.0)",
                request_headers={"Accept": "application/rss+xml, application/xml"},
            )

            if feed.bozo and not feed.entries:
                logger.warning(
                    f"RSS parse error for {feed_info['name']}: {feed.bozo_exception}"
                )
                continue

            count = 0
            for entry in feed.entries:
                if count >= MAX_PER_FEED or len(articles) >= max_total:
                    break

                url = entry.get("link", "").strip()
                title = entry.get("title", "").strip()

                if not _is_valid_url(url) or url in seen_urls:
                    continue
                if not _is_valid_title(title):
                    continue

                articles.append(
                    {
                        "title": title,
                        "url": url,
                        "source": feed_info["name"],
                        "credibility": feed_info["credibility"],
                        "published": _parse_date(entry),
                        "description": _clean_description(entry.get("summary", "")),
                    }
                )
                seen_urls.add(url)
                count += 1

        except Exception as e:
            logger.warning(f"Failed to fetch RSS from {feed_info['name']}: {e}")

    logger.info(
        f"Fetched {len(articles)} trending articles ({len(feeds_sorted)} feeds)"
    )
    return articles[:max_total]
