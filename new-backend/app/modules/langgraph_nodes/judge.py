def judge_perspective(state):
    """
    Evaluates the 'perspective' in the given state and assigns a score.
    
    Assigns a score of 85 if the substring "reasoned" is present in the perspective;
    otherwise, assigns a score of 40. Returns the score in a dictionary.
    
    Args:
        state: A dictionary containing a 'perspective' key.
    
    Returns:
        A dictionary with the assigned score under the key 'score'.
    """
    perspective = state["perspective"]
    # Dummy scoring
    score = 85 if "reasoned" in perspective else 40
    return {"score": score}

# llm based score assignment
