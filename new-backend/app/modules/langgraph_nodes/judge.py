def judge_perspective(state):
    perspective = state["perspective"]
    # Dummy scoring
    try:
        score = 85 if "reasoned" in perspective else 40
    except Exception as e:
        print(f"some error occured:{e}")
        return {
            "error": str(e)
        }
    return {
        **state,
        "score": score
        }

# llm based score assignment
