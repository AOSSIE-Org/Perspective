def judge_perspective(state):
    # Dummy scoring
    try:
        perspective = state.get("perspective")

        if not perspective:
            raise ValueError("Missing or empty 'perspective' in state")

        score = 85 if "reasoning" in perspective else 40
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
