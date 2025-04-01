SUMMARIZATION_PROMPT = """
You are an AI assistant that summarizes web content in a clear and concise manner. Given the text below, generate a structured and digestible summary that captures the key points and main ideas.

Content:
{web_content}

Guidelines:
1. Extract the most important information while maintaining clarity.
2. Ensure readability and coherence in the summary.
3. Structure the summary in short paragraphs or bullet points.
4. Keep the tone neutral and informative.
5. Avoid excessive details—focus on the core message.

Format your response as a well-structured summary.
"""

def get_summarization_prompt(web_content: str) -> str:
    """
    Formats the prompt for generating a web content summary by injecting the provided text.
    """
    return SUMMARIZATION_PROMPT.format(web_content=web_content)
