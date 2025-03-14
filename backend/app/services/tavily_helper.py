import requests
import json

def tavily_search(query: str, token: str, max_results: int = 5):
    """
    Calls Tavily's /search endpoint using the official doc snippet
    and returns either the parsed JSON or an error string.
    """
    url = "https://api.tavily.com/search"

    payload = {
        "query": query,
        "topic": "general",
        "search_depth": "basic",
        "max_results": max_results,
        "time_range": None,
        "days": 3,
        "include_answer": True,
        "include_raw_content": False,
        "include_images": False,
        "include_image_descriptions": False,
        "include_domains": [],
        "exclude_domains": []
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            return f"HTTPError({response.status_code}): {response.text}"
        # If successful, return the raw JSON string
        return response.text
    except Exception as e:
        return f"RequestException: {str(e)}"
