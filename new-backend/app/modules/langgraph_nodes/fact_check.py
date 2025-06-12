# web search + fact  check

def search_web():
    return None


def run_fact_check(state):
    text = state["text"]
    keywords = state["keywords"]
    results = search_web(text + " " + " ".join(keywords))
    sources = [{"snippet": r.text, "url": r.link} for r in results]
    return {
        **state,
        "facts": sources
        }
