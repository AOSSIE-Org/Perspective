from duckduckgo_search import DDGS


def search_duckduckgo(query, max_results=1):
    with DDGS() as ddgs:
        results = ddgs.text(query, max_results=max_results)
        print(results)
        return [
            {
                "title": r["title"],
                "snippet": r["body"],
                "link": r["href"]
            }
            for r in results
        ]
