# web search + fact  check

def search_web():
    return []


def run_fact_check(state):
    try:
        text = state.get("cleaned_text")
        keywords = state["keywords"]

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")
        elif not keywords:
            raise ValueError("Missing or empty 'keywords' in state")

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
