"""
web_search.py
-------------
DuckDuckGo search wrapper with retry logic, multi-result fetching,
and source credibility scoring.

Improvements over v1:
    - Fetches up to 3 results per query (more evidence for fact-checking)
    - Retries up to 3 times with exponential backoff on failure
    - Scores source credibility based on known high-quality domains
    - Returns structured results sorted by credibility
"""

import time
import random
from duckduckgo_search import DDGS
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

# Known credible news, science, and government domains
CREDIBLE_DOMAINS = {
    # Tier 1 — highest credibility
    "reuters.com": 95,
    "apnews.com": 95,
    "bbc.com": 92,
    "bbc.co.uk": 92,
    "npr.org": 90,
    "pbs.org": 90,
    "nature.com": 95,
    "science.org": 95,
    "who.int": 95,
    "cdc.gov": 95,
    "nih.gov": 95,
    "gov.uk": 90,
    "un.org": 90,
    "worldbank.org": 88,
    # Tier 2 — generally reliable
    "theguardian.com": 85,
    "nytimes.com": 83,
    "washingtonpost.com": 82,
    "economist.com": 88,
    "ft.com": 86,
    "bloomberg.com": 84,
    "sciencedaily.com": 80,
    "scholar.google.com": 90,
    "arxiv.org": 88,
    "pubmed.ncbi.nlm.nih.gov": 95,
    "britannica.com": 85,
    "wikipedia.org": 70,
    # Tier 3 — moderate credibility
    "cnbc.com": 72,
    "forbes.com": 70,
    "businessinsider.com": 65,
}


def _get_credibility_score(url: str) -> int:
    """Return a 0–100 credibility score for a URL based on its domain."""
    try:
        from urllib.parse import urlparse

        domain = urlparse(url).netloc.lower().lstrip("www.")
        # Check exact match first, then parent domain
        if domain in CREDIBLE_DOMAINS:
            return CREDIBLE_DOMAINS[domain]
        for known_domain, score in CREDIBLE_DOMAINS.items():
            if domain.endswith(known_domain):
                return score
    except Exception:
        pass
    return 50  # unknown domain — neutral score


def search_google(query: str, max_results: int = 3) -> list[dict]:
    """
    Search DuckDuckGo for the query and return up to `max_results` results.
    Retries up to 3 times with exponential backoff.
    Results are sorted by credibility score (descending).
    """
    max_attempts = 3
    for attempt in range(1, max_attempts + 1):
        try:
            raw_results = list(DDGS().text(query, max_results=max_results))
            if not raw_results:
                return []

            results = []
            for r in raw_results:
                link = r.get("href", "")
                results.append(
                    {
                        "title": r.get("title", ""),
                        "link": link,
                        "snippet": r.get("body", ""),
                        "credibility": _get_credibility_score(link),
                    }
                )

            # Sort by credibility so the best source comes first
            results.sort(key=lambda x: x["credibility"], reverse=True)
            logger.debug(f"Search returned {len(results)} results for: {query[:60]}")
            return results

        except Exception as e:
            wait = (2**attempt) + random.uniform(0, 1)
            logger.warning(
                f"Search attempt {attempt} failed for '{query[:40]}': {e}. Retrying in {wait:.1f}s"
            )
            if attempt < max_attempts:
                time.sleep(wait)

    logger.error(f"All search attempts failed for query: {query[:60]}")
    return []
