import requests
from bs4 import BeautifulSoup

def scrape_website(url, headers=None):
    """
    Scrapes the content of a website and returns the raw HTML.
    """
    try:
        if headers is None:
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }

        response = requests.get(url, headers=headers)
        response.raise_for_status()  # Raise an error for bad responses (4xx, 5xx)

        soup = BeautifulSoup(response.content, 'html.parser')
        return soup.get_text()  # Extract only readable text

    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
        return None




# # Example usage:
# url = 'https://en.wikipedia.org/wiki/Bird'
# raw_data = scrape_website(url)
# clean_data = clean_scraped_data(raw_data)

# print("Raw Data:"+raw_data)
# print("Cleaned Data"+clean_data)