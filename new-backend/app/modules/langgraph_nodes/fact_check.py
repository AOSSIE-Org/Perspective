# web search + fact  check

def search_web():
    return None


def run_fact_check(state):
    try:
        text = state["text"]
        keywords = state["keywords"]
        results = search_web(text + " " + " ".join(keywords))
        sources = [{"snippet": r.text, "url": r.link} for r in results]
    except Exception as e:
        print(f"some error occured:{e}")
        return {
            "error": str(e)
        }
    return {
        **state,
        "facts": sources
        }
