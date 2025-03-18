import requests
import os
import json
from dotenv import load_dotenv

# Load API Key from .env file
load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")  # Updated to use Groq API Key

# Define Groq API URL
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"

# Function to summarize text
def summarize_text(payload):
    try:
        headers = {
            "Authorization": f"Bearer {API_KEY}",
            "Content-Type": "application/json"
        }

        groq_payload = json.dumps({
            "model": "llama3-70b-8192",  # Updated to a Groq-compatible model
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful AI assistant that provides concise and accurate summaries."
                },
                {
                    "role": "user",
                    "content": f"Please provide a concise summary of the following text:\n\n{payload['inputs']}"
                }
            ]
        })

        response = requests.post(GROQ_API_URL, headers=headers, data=groq_payload)

        print(f"Summarization API response status: {response.status_code}")
        print(f"Summarization API response text: {response.text}")

        if response.status_code != 200 or not response.text:
            raise Exception(f"Summarization API error, status code {response.status_code}")

        summary_response = response.json()
        summary = summary_response['choices'][0]['message']['content']

        return summary

    except Exception as e:
        print(f"Error in summarization service: {e}")
        raise Exception(f"Error in summarization service: {str(e)}")
