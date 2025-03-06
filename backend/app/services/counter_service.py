import requests
from app.prompts.opposite_perspective import get_opposite_perspective_prompt
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("API_KEY")


def generate_opposite_perspective(article_text):
   
    PERSPECTIVE_URL = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
   
    # final_prompt = get_opposite_perspective_prompt(article_text)
    final_prompt = get_opposite_perspective_prompt().format(article_text=article_text)

    
    payload = {
        "model": "deepseek/deepseek-chat",
        "messages": [
            {
                "role": "user", 
                "content": final_prompt
            }
        ]
    }
    
    response = requests.post(PERSPECTIVE_URL, headers=headers, json=payload)
    result = response.json()['choices'][0]['message']['content']
    
   
    if "Opposite Perspective:" in result:
        perspective = result.split("Opposite Perspective:")[-1].strip()
    else:
        perspective = result.strip()
    
    return perspective