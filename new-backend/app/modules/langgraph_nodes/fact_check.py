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
        print(f"some error occured in fact_checking:{e}")
        return {
            "status": "error",
            "error_from": "fact_checking",
            "message": f"{e}",
            }
    return {
        **state,
        "facts": sources,
        "status": "success"
        }
