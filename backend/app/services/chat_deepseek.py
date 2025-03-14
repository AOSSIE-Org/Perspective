# backend/app/services/chat_deepseek.py
import os
import json
import requests
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("API_KEY")
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
headers = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json",
}

class ChatDeepseek:
    def __init__(self, model: str):
        self.model = model

    def invoke(self, messages):
        """
        Expects messages to be a list of dictionaries, each with "role" and "content" keys.
        Returns the response content from the API.
        """
        payload = {
            "model": self.model,
            "messages": messages,
        }
        response = requests.post(OPENROUTER_URL, headers=headers, data=json.dumps(payload))
        if response.status_code != 200:
            return f"API error: {response.status_code}"
        try:
            data = response.json()
            return data["choices"][0]["message"]["content"]
        except Exception as e:
            return f"Error parsing response: {str(e)}"
