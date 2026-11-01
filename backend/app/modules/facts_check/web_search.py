"""
web_search.py
-------------
Provides a search wrapper for performing claim verification queries.
Attempts Google Custom Search if configured, with an automatic fallback
to DuckDuckGo search.
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
    SEARCH_KEY_PLACEHOLDER,
)

logger = setup_logger(__name__)
load_dotenv()

GOOGLE_SEARCH = os.getenv("SEARCH_KEY")


def search_google(query):
    # 1. Try Google Custom Search if a valid key is provided
    if GOOGLE_SEARCH and GOOGLE_SEARCH != SEARCH_KEY_PLACEHOLDER:
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
