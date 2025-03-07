import requests
import os
import json
from dotenv import load_dotenv
import logging


load_dotenv()
openrouter_token = os.getenv("API_KEY")

Summarization_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {openrouter_token}",
    "Content-Type": "application/json",
}

logger = logging.getLogger("uvicorn.error")


def summarize_text(payload):
    print("h")
    try:
        openrouter_payload = json.dumps({
            "model": "deepseek/deepseek-chat",
            "messages": [
                {
                    "role": "system",
                    "content": "You are a helpful assistant that provides concise and accurate summaries."
                },
                {
                    "role": "user",
                    "content": f"Please provide a concise summary of the following text:\n\n{payload['inputs']}"
                }
            ],
        })
        print(openrouter_payload)
        print(openrouter_token)

        response = requests.post(
            Summarization_URL, headers=headers, data=openrouter_payload)

        print("Summarization API response status: %s", response.status_code)
        print("Summarization API response text: %s", response.text)

        if response.status_code != 200 or not response.text:
            raise Exception(f"Summarization API error, status code {
                            response.status_code}")

        summary_response = response.json()
        summary = summary_response['choices'][0]['message']['content']

        return summary

    except Exception as e:
        print("Error in summarization service: %s", e)
        raise Exception("Error in summarization service: " + str(e))
