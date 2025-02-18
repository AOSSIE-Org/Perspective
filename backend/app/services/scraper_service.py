import requests
from bs4 import BeautifulSoup
from typing import Optional
from functools import lru_cache

@lru_cache(maxsize=100)
async def scrape_url(url: str) -> Optional[str]:
    """
    Scrape content from a URL using BeautifulSoup
    """
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove unwanted elements
        for tag in soup(['script', 'style', 'nav', 'footer', 'iframe']):
            tag.decompose()
            
        # Get main content
        content = ' '.join(soup.stripped_strings)
        return content
    except Exception as e:
        raise Exception(f"Failed to scrape URL: {str(e)}") 