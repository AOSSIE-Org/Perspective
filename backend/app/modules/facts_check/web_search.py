"""
web-search.py
-------------
Provides a simple wrapper for performing Google Custom Search queries.

This module:
    - Loads the Google Search API key from environment variables.
    - Sends search requests to the Google Custom Search API.
    - Returns the first search result with title, link, and snippet.

Functions:
    search_google(query: str) -> list[dict]:
        Executes a Google search for the given query and returns the top result
        in a list containing its title, link, and snippet.

Environment Variables:
    SEARCH_KEY (str): API key for Google Custom Search API.
"""


import requests
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_SEARCH = os.getenv("SEARCH_KEY")


def search_google(query):
    try:
        results = requests.get(
            f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_SEARCH}&cx=f637ab77b5d8b4a3c&q={query}"
        )
        res = results.json()
        
        # Check if the response contains 'items' (successful search)
        if "items" not in res:
            # Handle error responses from Google API
            error_msg = res.get("error", {}).get("message", "Unknown error")
            raise ValueError(f"Google API Error: {error_msg}")
        
        first = {}
        first["title"] = res["items"][0]["title"]
        first["link"] = res["items"][0]["link"]
        first["snippet"] = res["items"][0]["snippet"]

        return [first]
    except Exception as e:
        print(f"Search Google Error: {e}")
        raise
