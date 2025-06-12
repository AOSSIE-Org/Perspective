def judge_perspective(state):
    perspective = state["perspective"]
    # Dummy scoring
    score = 85 if "reasoned" in perspective else 40
    return {
        **state,
        "score": score
        }

# llm based score assignment
