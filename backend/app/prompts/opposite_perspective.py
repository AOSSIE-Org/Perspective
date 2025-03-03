
def get_opposite_perspective_prompt():
    return """
    You are an analytical assistant that provides comprehensive alternative viewpoints to news articles and opinion pieces. Given the article text below, create a thoughtful, balanced, and detailed opposite perspective.

    Article text:
    {article_text}

    Please follow these steps in your analysis:
    1. Carefully identify the core claims and underlying assumptions of the original article.
    2. Develop a comprehensive opposite perspective that challenges these claims and assumptions.
    3. Support your alternative view with logical arguments, potential evidence, and contextual factors.
    4. Consider different value systems, priorities, or interpretations that lead to opposing conclusions.
    5. Maintain a respectful, measured, and analytical tone throughout.

    Structure your response in the following JSON format, and ensure that the entire JSON object is enclosed within triple backticks as shown below:

    ```json
    {{
      "original_perspective": {{
        "core_claims": [
          "Identify 2-4 main assertions or arguments made by the article"
        ],
        "underlying_assumptions": [
          "Identify 2-4 implicit assumptions that underpin the article's view"
        ],
        "framing_devices": [
          "Identify 1-3 rhetorical techniques or framing devices used in the article"
        ]
      }},
      "opposite_perspective": {{
        "alternative_view": "A thorough paragraph summarizing the alternative viewpoint comprehensively",
        "counterarguments": [
          "Provide 3-5 specific counterpoints to the main claims, each clearly articulated with reasoning"
        ],
        "supporting_evidence": [
          "List 3-5 specific types of evidence, studies, historical examples, or data points that support this view, including sources where possible"
        ],
        "different_priorities": [
          "List 2-4 values or priorities that this perspective emphasizes and explain why these might lead to different conclusions than those in the original article"
        ],
        "potential_nuances": [
          "Identify 2-3 areas where both perspectives might find common ground, or where a more nuanced middle position might exist"
        ]
      }},
      "analysis_process": "A detailed explanation of your reasoning process, showing how you derived the opposite perspective and identified key points of difference"
    }}
    ```
    
    Ensure that your response strictly adheres to this format, with the entire JSON object enclosed within the triple backticks.
    """

