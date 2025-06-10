from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
from app.modules.langgraph_builder import build_langgraph
import json


def run_scraper_pipeline(url: str) -> dict:
    """
    Extracts and processes article content from a given URL.
    
    The function retrieves the article text from the specified URL, cleans the extracted text, and identifies relevant keywords. Returns a dictionary containing the cleaned text and extracted keywords.
    	
    Args:
    	url: The URL of the article to process.
    
    Returns:
    	A dictionary with 'cleaned_text' and 'keywords' keys.
    """
    extractor = Article_extractor(url)
    raw_text = extractor.extract()

    # Clean the text
    result = {}
    cleaned_text = clean_extracted_text(raw_text["text"])
    result["cleaned_text"] = cleaned_text

    # Extract keywords
    keywords = extract_keywords(cleaned_text)
    result["keywords"] = keywords

    # Optional: pretty print raw_text for debugging
    print(json.dumps(result, indent=2, ensure_ascii=False))

    return result


def run_langgraph_workflow(state: dict):
    """
    Executes a language graph workflow with the provided state.
    
    Args:
        state: A dictionary representing the initial state for the workflow.
    
    Returns:
        The result produced by invoking the language graph workflow with the given state.
    """
    langgraph_workflow = build_langgraph()
    result = langgraph_workflow.invoke(state)
    return result
