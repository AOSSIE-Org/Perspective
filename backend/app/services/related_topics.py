import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

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

def generate_related_topics(summary: str):
    """Generate a list of relevant topics using ChatGroq."""
    llm_helper = LLMHelper()
    
    prompt = (
        "You are an AI that only generates relevant links to topics based on a given summary.\n"
        f"Generate a list of 5 relevant online links which should not show this page not found error the link should be working based on this summary:\n{summary}"
    )
    
    result = llm_helper.get_response(prompt)
    
    return result if result else ["Error fetching related topics"]
