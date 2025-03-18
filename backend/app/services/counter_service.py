import requests
from app.prompts.opposite_perspective import get_opposite_perspective_prompt
from dotenv import load_dotenv
import os

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")  # Updated to use GROQ_API_KEY

def generate_opposite_perspective(article_text):
    # Updated to use Groq API endpoint
    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    final_prompt = get_opposite_perspective_prompt().format(article_text=article_text)
    
    payload = {
        "model": "llama3-70b-8192",  # Using Llama3 model from Groq
        "messages": [
            {
                "role": "user", 
                "content": final_prompt
            }
        ]
    }
    
    response = requests.post(GROQ_URL, headers=headers, json=payload)
    result = response.json()['choices'][0]['message']['content']
    
    if "Opposite Perspective:" in result:
        perspective = result.split("Opposite Perspective:")[-1].strip()
    else:
        perspective = result.strip()
    
    print("perspective", perspective)
    
    return perspective