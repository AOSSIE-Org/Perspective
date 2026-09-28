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

logger = setup_logger(__name__)
load_dotenv()

GOOGLE_SEARCH = os.getenv("SEARCH_KEY")


def search_google(query):
    # 1. Try Google Custom Search if a valid key is provided
    if GOOGLE_SEARCH and GOOGLE_SEARCH != "your_google_search_api_key_here":
        try:
            results = requests.get(
                "https://www.googleapis.com/customsearch/v1",
                params={"key": GOOGLE_SEARCH, "cx": "f637ab77b5d8b4a3c", "q": query},
                timeout=8,
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
        ddg_results = list(ddgs.text(query, max_results=3))
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
