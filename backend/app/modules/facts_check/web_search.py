import requests
from dotenv import load_dotenv
import os

load_dotenv()

GOOGLE_SEARCH = os.getenv("SEARCH_KEY")

def search_google(query):
    results = requests.get(f"https://www.googleapis.com/customsearch/v1?key={GOOGLE_SEARCH}&cx=f637ab77b5d8b4a3c&q={query}")
    res = results.json()
    first = {}
    first["title"] = res["items"][0]["title"]
    first["link"] = res["items"][0]["link"]
    first["snippet"] = res["items"][0]["snippet"]
    
    return [
        first,
    ]