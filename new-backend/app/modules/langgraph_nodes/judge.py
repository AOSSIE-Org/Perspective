def judge_perspective(state):
    perspective = state["perspective"]
    # Dummy scoring
    try:
        score = 85 if "reasoned" in perspective else 40
    except Exception as e:
        print(f"some error occured in judge_perspetive:{e}")
        return {
            "status": "error",
            "error_from": "judge_perspective",
            "message": f"{e}",
            }
    return {
        **state,
        "score": score,
        "status": "success"
        }

# llm based score assignment
