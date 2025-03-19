import os
from dotenv import load_dotenv
import logging
from langchain_groq import ChatGroq

# Load environment variables
load_dotenv()

logger = logging.getLogger("uvicorn.error")

class LLMHelper:
    """Helper class to interact with ChatGroq's Llama3 model."""
    def __init__(self):
        self.llm = ChatGroq(groq_api_key=os.getenv("GROQ_API_KEY"), model_name="llama3-8b-8192")

    def get_response(self, prompt):
        """Send the prompt to ChatGroq and return the response."""
        response = self.llm.invoke(prompt)
        return response.content  # Extract and return the response content

def summarize_text(payload):
    """Summarize the given text using ChatGroq."""
    try:
        llm_helper = LLMHelper()
        
        prompt = (
            "You are a helpful assistant that provides concise and accurate summaries.\n"
            f"Please provide a concise summary of the following text:\n\n{payload['inputs']}"
        )
        
        summary = llm_helper.get_response(prompt)
        
        return summary
    
    except Exception as e:
        logger.error("Error in summarization service: %s", e)
        raise Exception("Error in summarization service: " + str(e))
