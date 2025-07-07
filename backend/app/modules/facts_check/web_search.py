from serpapi import GoogleSearch
import os


def search_with_serpapi(query, max_results=1):
    api_key = os.getenv("SERPAPI_KEY")
    if not api_key:
        raise ValueError("SERPAPI_KEY not set in environment")

    params = {
        "engine": "google",
        "q": query,
        "api_key": api_key,
        "num": max_results,
    }

    search = GoogleSearch(params)
    results = search.get_dict()
    organic = results.get("organic_results", [])

    return [
        {
            "title": r.get("title", ""),
            "snippet": r.get("snippet", ""),
            "link": r.get("link", ""),
        }
        for r in organic
    ]
