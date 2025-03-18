import requests
import json
from bs4 import BeautifulSoup
import urllib.parse
import re
from collections import Counter

def fetch_article_details(url):
    """Fetches the article title and content from the given URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract title from the <title> tag
        title_tag = soup.find("title")
        article_title = title_tag.get_text().strip() if title_tag else ""
        
        text = ""
        # Special extraction for Times of India pages
        if "indiatimes.com" in url:
            container = (soup.find("div", {"class": "article_content"}) or 
                         soup.find("div", {"class": "content-container"}) or 
                         soup.find("article"))
            if container:
                text = " ".join(p.get_text() for p in container.find_all("p"))
            else:
                text = " ".join(p.get_text() for p in soup.find_all("p"))
        else:
            text = " ".join(p.get_text() for p in soup.find_all("p"))
        
        # Clean text: remove tab characters and extra whitespace
        text = text.replace("\t", " ")
        text = re.sub(r'\s+', ' ', text).strip()
        return {"title": article_title, "text": text}
    except Exception as e:
        return {"title": "", "text": f"Error fetching content: {e}"}

def extract_keywords(text, article_title="", num_keywords=5):
    """Extracts keywords from text using frequency analysis and prepends the article title if provided."""
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text.lower())
    common_words = {"the", "with", "this", "that", "from", "about", "have", "more"}
    filtered_words = [word for word in words if word not in common_words]
    most_common = Counter(filtered_words).most_common(num_keywords)
    keywords = [word[0] for word in most_common]
    keyword_string = " ".join(keywords)
    # Prepend article title if available
    if article_title:
        keyword_string = f"{article_title} {keyword_string}"
    return keyword_string

def search_query(query):
    """Uses DuckDuckGo to fetch search results based on keywords."""
    search_url = f"https://html.duckduckgo.com/html/?q={query}"
    headers = {"User-Agent": "Mozilla/5.0"}
    response = requests.get(search_url, headers=headers)
    soup = BeautifulSoup(response.text, "html.parser")
    results = []
    for result in soup.find_all("a", class_="result__a", limit=5):
        title = result.get_text()
        link = result["href"]
        parsed_link = urllib.parse.parse_qs(urllib.parse.urlparse(link).query).get('uddg', [None])[0]
        if parsed_link:
            results.append({"title": title, "link": parsed_link})
    return results

def extract_date(soup):
    """Extracts published date from meta tags or visible elements."""
    date = None
    # Check meta tags
    date_meta = soup.find("meta", {"property": "article:published_time"}) or \
                soup.find("meta", {"name": "date"}) or \
                soup.find("meta", {"itemprop": "datePublished"})
    
    if date_meta and date_meta.get("content"):
        date = date_meta["content"]
    
    # Check for visible date elements
    if not date:
        time_tag = soup.find("time")
        if time_tag and time_tag.get("datetime"):
            date = time_tag["datetime"]
        elif time_tag:
            date = time_tag.get_text(strip=True)
    
    return date if date else "Date not found"

def summarize_page(url):
    """Fetches and summarizes webpage content while extracting keywords and date."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=5)
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Extract date
        date = extract_date(soup)
        
        # Extract summary
        paragraphs = soup.find_all("p")
        text = " ".join(p.get_text() for p in paragraphs[:5])
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Ensure summary ends at a complete sentence
        if len(text) > 500:
            text = text[:500]
            last_period = text.rfind(".")
            if last_period != -1:
                text = text[:last_period+1]
        
        # Extract keywords
        keywords = extract_keywords(text)
        
        return {"summary": text, "keywords": keywords, "date": date}
    
    except Exception as e:
        return {"summary": f"Error fetching content: {e}", "keywords": "", "date": ""}

def generate_combined_summary(summaries):
    """Generates a combined summary by simply concatenating all individual summaries."""
    combined_text = " ".join([s["summary"]["summary"] for s in summaries if "Error" not in s["summary"]["summary"] and s["summary"]["summary"].strip() != ""])
    # Clean combined text: remove extra whitespace
    combined_text = combined_text.replace("\t", " ")
    combined_text = re.sub(r'\s+', ' ', combined_text).strip()
    return combined_text if combined_text else "No meaningful summary available."

def do_deep_research(article_url):
    """Takes an article URL, extracts title and keywords, performs deep research, and outputs a JSON summary."""
    details = fetch_article_details(article_url)
    article_text = details["text"]
    if "Error" in article_text:
        print(json.dumps({"error": article_text}, indent=4))
        return
    
    # Extract keywords using both article text and title
    keywords = extract_keywords(article_text, details["title"])
    
    results = search_query(keywords)
    
    summaries = []
    for result in results:
        summary = summarize_page(result["link"])
        summaries.append({
            "title": result["title"],
            "link": result["link"],
            "summary": summary
        })
    
    combined_summary = generate_combined_summary(summaries)
    
    output = {
        "combined_summary": combined_summary,
        "individual_summaries": summaries
    }
    
    
    return output
