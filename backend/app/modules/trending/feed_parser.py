"""
feed_parser.py
--------------
Ingestion layer for fetching and parsing RSS feeds safely.
"""

import xml.etree.ElementTree as ET
from typing import Any, Dict, List
import requests

from app.config import (
    FETCH_TIMEOUT_SECONDS,
    SCRAPER_USER_AGENT,
    TRENDING_FEEDS,
    TRENDING_MAX_STORIES_PER_FEED,
)
from app.logging.logging_config import setup_logger
from app.modules.scraper.safe_fetch import UnsafeURLError, validate_public_url

logger = setup_logger(__name__)


def parse_rss_xml(xml_content: str, max_items: int = TRENDING_MAX_STORIES_PER_FEED) -> List[Dict[str, str]]:
    """
    Parses standard RSS 2.0 or Atom XML content into a structured list of stories.
    """
    stories: List[Dict[str, str]] = []
    try:
        root = ET.fromstring(xml_content)
    except ET.ParseError as e:
        logger.warning(f"Failed to parse RSS XML: {e}")
        return stories

    # Check for standard RSS 2.0 (<channel><item>...)
    items = root.findall(".//item")
    if not items:
        # Check for Atom feed (<entry>...)
        items = root.findall(".//{http://www.w3.org/2005/Atom}entry")

    for item in items[:max_items]:
        title = ""
        link = ""
        description = ""
        pub_date = ""

        # Title
        title_elem = item.find("title")
        if title_elem is not None and title_elem.text:
            title = title_elem.text.strip()

        # Link (RSS <link> or Atom <link href="...">)
        link_elem = item.find("link")
        if link_elem is not None:
            if link_elem.text:
                link = link_elem.text.strip()
            elif "href" in link_elem.attrib:
                link = link_elem.attrib["href"].strip()

        # Description / Summary
        desc_elem = item.find("description")
        if desc_elem is None:
            desc_elem = item.find("{http://www.w3.org/2005/Atom}summary")
        if desc_elem is not None and desc_elem.text:
            description = desc_elem.text.strip()

        # PubDate / Published
        date_elem = item.find("pubDate")
        if date_elem is None:
            date_elem = item.find("{http://www.w3.org/2005/Atom}published")
        if date_elem is not None and date_elem.text:
            pub_date = date_elem.text.strip()

        if title and link:
            # Validate public URL to prevent SSRF
            try:
                validate_public_url(link)
                stories.append({
                    "title": title,
                    "url": link,
                    "description": description,
                    "published_at": pub_date,
                })
            except UnsafeURLError:
                logger.warning(f"Skipping non-public or invalid URL in feed: {link}")

    return stories


def fetch_rss_feed(feed_url: str) -> List[Dict[str, str]]:
    """Fetches a single RSS feed and extracts stories."""
    try:
        validate_public_url(feed_url)
        headers = {"User-Agent": SCRAPER_USER_AGENT}
        response = requests.get(feed_url, headers=headers, timeout=FETCH_TIMEOUT_SECONDS)
        if response.status_code == 200:
            return parse_rss_xml(response.text)
        logger.warning(f"RSS feed {feed_url} returned HTTP {response.status_code}")
    except Exception as e:
        logger.error(f"Error fetching feed {feed_url}: {e}")
    return []


def fetch_rss_stories(feed_urls: List[str] = TRENDING_FEEDS) -> List[Dict[str, str]]:
    """Fetches and aggregates stories across all configured RSS feeds."""
    all_stories: List[Dict[str, str]] = []
    seen_urls = set()

    for url in feed_urls:
        stories = fetch_rss_feed(url)
        for s in stories:
            if s["url"] not in seen_urls:
                seen_urls.add(s["url"])
                all_stories.append(s)

    logger.info(f"Aggregated {len(all_stories)} distinct stories from {len(feed_urls)} feeds.")
    return all_stories

