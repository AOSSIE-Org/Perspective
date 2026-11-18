"""
web_search.py
-------------
Provides a search wrapper for performing claim verification queries.

The default path is unchanged: Google Custom Search when a key is
configured, with an automatic fallback to DuckDuckGo.

Set SEARCH_PROVIDER=keenable to use Keenable Search instead of Google
Custom Search, still falling back to DuckDuckGo if that call fails or
returns nothing. An API key is optional (KEENABLE_API_KEY); keyless
calls go to the public endpoint and send an X-Keenable-Title header.
Google's Custom Search JSON API is scheduled to shut down on
1 January 2027 (https://developers.google.com/custom-search/v1/overview).
"""

import os
import requests
from dotenv import load_dotenv
from duckduckgo_search import DDGS
from app.logging.logging_config import setup_logger
from app.config import (
    DDG_MAX_RESULTS,
    GOOGLE_SEARCH_ENGINE_ID,
    GOOGLE_SEARCH_TIMEOUT_SECONDS,
    GOOGLE_SEARCH_URL,
    KEENABLE_PUBLIC_SEARCH_URL,
    KEENABLE_SEARCH_MAX_RESULTS,
    KEENABLE_SEARCH_TIMEOUT_SECONDS,
    KEENABLE_SEARCH_TITLE,
    KEENABLE_SEARCH_URL,
    SEARCH_KEY_PLACEHOLDER,
)

logger = setup_logger(__name__)
load_dotenv()

GOOGLE_SEARCH = os.getenv("SEARCH_KEY")
# Opt-in only. Anything other than "keenable" keeps the Google-then-DDG path.
SEARCH_PROVIDER = (os.getenv("SEARCH_PROVIDER") or "google").strip().lower()
KEENABLE_API_KEY = (os.getenv("KEENABLE_API_KEY") or "").strip()


def _keenable_enabled():
    return SEARCH_PROVIDER == "keenable"


def _keenable_hit(item):
    """Keep the first ranked hit that has a usable URL and evidence text."""
    if not isinstance(item, dict):
        return None
    url = item.get("url") or item.get("link") or ""
    if not isinstance(url, str) or not url.strip():
        return None
    snippet = item.get("snippet") or item.get("content") or item.get("description") or ""
    if not isinstance(snippet, str) or not snippet.strip():
        return None
    return {
        "title": item.get("title") or "",
        "link": url,
        "snippet": snippet,
    }


def _first_keenable_result(payload):
    if not isinstance(payload, dict):
        return None
    items = payload.get("results") or []
    if not isinstance(items, list):
        return None
    for item in items:
        hit = _keenable_hit(item)
        if hit:
            return hit
    return None


def _search_keenable(query):
    api_key = KEENABLE_API_KEY
    url = KEENABLE_SEARCH_URL if api_key else KEENABLE_PUBLIC_SEARCH_URL
    headers = {
        "Content-Type": "application/json",
        "X-Keenable-Title": KEENABLE_SEARCH_TITLE,
    }
    if api_key:
        headers["X-API-Key"] = api_key
    response = requests.post(
        url,
        json={
            "query": query,
            "max_results": KEENABLE_SEARCH_MAX_RESULTS,
            "disable_cards": True,
        },
        headers=headers,
        timeout=KEENABLE_SEARCH_TIMEOUT_SECONDS,
    )
    response.raise_for_status()
    return _first_keenable_result(response.json())


def search_google(query):
    # 0. Opt-in Keenable path: replace Google CSE, keep DuckDuckGo as fallback.
    if _keenable_enabled():
        try:
            first = _search_keenable(query)
            if first:
                return [first]
        except Exception as exc:
            logger.warning(
                "Keenable search error, falling back to DuckDuckGo: %s",
                type(exc).__name__,
            )

    # 1. Try Google Custom Search if a valid key is provided
    elif GOOGLE_SEARCH and GOOGLE_SEARCH != SEARCH_KEY_PLACEHOLDER:
        try:
            results = requests.get(
                GOOGLE_SEARCH_URL,
                params={"key": GOOGLE_SEARCH, "cx": GOOGLE_SEARCH_ENGINE_ID, "q": query},
                timeout=GOOGLE_SEARCH_TIMEOUT_SECONDS,
            )
            res = results.json()
            if "items" in res and len(res["items"]) > 0:
                first = {
                    "title": res["items"][0].get("title", ""),
                    "link": res["items"][0].get("link", ""),
                    "snippet": res["items"][0].get("snippet", ""),
                }
                return [first]
        except Exception as e:
            logger.warning(f"Google search error, falling back to DuckDuckGo: {e}")

    # 2. Fallback to DuckDuckGo Search (no API key required)
    try:
        ddgs = DDGS()
        ddg_results = list(ddgs.text(query, max_results=DDG_MAX_RESULTS))
        if ddg_results:
            first = {
                "title": ddg_results[0].get("title", ""),
                "link": ddg_results[0].get("href", ""),
                "snippet": ddg_results[0].get("body", ""),
            }
            return [first]
    except Exception as e:
        logger.warning(f"DuckDuckGo search error: {e}")

    # 3. Both providers failed — return empty; caller decides how to handle
    return []
