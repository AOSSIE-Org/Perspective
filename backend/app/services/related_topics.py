import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()
API_KEY = os.getenv("GROQ_API_KEY")  # Updated to use GROQ_API_KEY

def generate_related_topics(summary: str):
    url = "https://api.groq.com/openai/v1/chat/completions"  # Changed to Groq API endpoint
    
    headers = {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = json.dumps({
        "model": "llama3-70b-8192",  # Changed to a Groq model
        "messages": [
            {
                "role": "system", 
                "content": "You are an AI that only generates relevant links to topics based on a given summary."
            },
            {
                "role": "user",
                "content": f"Generate a list of 5 relevant online links which are working should not be page not found based on this summary:\n{summary}"
            }
        ],
    })
    
    response = requests.post(url, data=payload, headers=headers)
    print(response)
    if response.status_code == 200:
        data = response.json()
        ai_response = data["choices"][0]["message"]["content"]
        
        return ai_response
        # links = [line.strip() for line in ai_response.split("\n") if line.startswith("http")]
        # print(links)
        # return links if links else ["No links found"]
    else:
        return ["Error fetching related topics"]