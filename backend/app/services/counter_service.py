import os
from langchain_groq import ChatGroq
from dotenv import load_dotenv
from app.prompts.opposite_perspective import get_opposite_perspective_prompt

# Load environment variables
load_dotenv()

class LLMHelper:
    """Helper class to interact with ChatGroq's Llama3 model."""
    def __init__(self):
        self.llm = ChatGroq(groq_api_key=os.getenv("GROQ_API_KEY"), model_name="llama3-8b-8192")

    def get_response(self, prompt):
        """Send the prompt to ChatGroq and return the response."""
        response = self.llm.invoke(prompt)
        return response.content  # Extract and return the response content

def generate_opposite_perspective(article_text):
    """Generate an opposite perspective using ChatGroq."""
    llm_helper = LLMHelper()
    final_prompt = get_opposite_perspective_prompt(article_text)
    
    result = llm_helper.get_response(final_prompt)

    if "Opposite Perspective:" in result:
        perspective = result.split("Opposite Perspective:")[-1].strip()
    else:
        perspective = result.strip()
    
    return perspective
