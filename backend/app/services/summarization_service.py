import requests
from dotenv import load_dotenv
import os
import logging

load_dotenv()
hf_token = os.getenv("HF_TOKEN")
Summarization_URL = "https://api-inference.huggingface.co/models/google/bigbird-pegasus-large-arxiv"
headers = {"Authorization": f"Bearer {hf_token}"}
print(hf_token)

logger = logging.getLogger("uvicorn.error")

def summarize_text(payload):
    try:
        response = requests.post(Summarization_URL, headers=headers, json=payload)
        print("Summarization API response status: %s", response.status_code)
        print("Summarization API response text: %s", response.text)
        
        # Check if the response is empty or not successful.
        if response.status_code != 200 or not response.text:
            raise Exception(f"Summarization API error, status code {response.status_code}")
        
        summary = response.json()
        return summary
    except Exception as e:
        print("Error in summarization service: %s", e)
        raise Exception("Error in summarization service: " + str(e))


