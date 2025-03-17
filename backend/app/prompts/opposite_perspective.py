OPPOSITE_PERSPECTIVE_PROMPT = """
    [INSTRUCTIONS]
    You are an analytical assistant that provides comprehensive alternative viewpoints to news articles and opinion pieces. Given the article text below, create a thoughtful, balanced, and detailed opposite perspective.

    Please follow these steps in your analysis:
    1. Carefully identify the core claims and underlying assumptions of the original article.
    2. Develop a comprehensive opposite perspective that challenges these claims and assumptions.
    3. Support your alternative view with logical arguments, potential evidence, and contextual factors.
    4. Consider different value systems, priorities, or interpretations that lead to opposing conclusions.
    5. Maintain a respectful, measured, and analytical tone throughout.

    [ARTICLE]
    Article text:
    {article_text}

    [RESPONSE]
    Opposite Perspective:
    """


def get_opposite_perspective_prompt(article_text: str) -> str:
    """
    Formats the prompt for generating an opposite perspective by injecting the provided article text.
    """
    return OPPOSITE_PERSPECTIVE_PROMPT.format(article_text=article_text)
