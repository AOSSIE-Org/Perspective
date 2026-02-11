"""
pipeline.py
-----------
Module that orchestrates the scraping, text cleaning, keyword extraction, 
and LangGraph workflow execution for article analysis.

Workflow:
    1. Scraping:
        - Fetches article content from a given URL using 
          `Article_extractor`, which attempts multiple extraction 
          strategies with fallbacks.
    2. Cleaning:
        - Processes extracted text to remove noise and formatting 
          artifacts via `clean_extracted_text`.
    3. Keyword Extraction:
        - Identifies important keywords from the cleaned article 
          using RAKE-based `extract_keywords`.
    4. LangGraph Processing:
        - Passes structured state into a pre-compiled LangGraph 
          workflow (`_LANGGRAPH_WORKFLOW`) for sentiment analysis, 
          fact-checking, perspective generation, judging, and 
          storage.

Core Functions:
    run_scraper_pipeline(url: str) -> dict
        Executes the scraping, cleaning, and keyword extraction stages, 
        returning a dictionary containing the cleaned text and keywords.
    
    run_langgraph_workflow(state: dict) -> dict
        Invokes the pre-compiled LangGraph workflow with the provided 
        state dictionary and returns the result.
"""


from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
from app.modules.langgraph_builder import build_langgraph
from app.logging.logging_config import setup_logger
import json
import asyncio

logger = setup_logger(__name__)

# Compile once when module loads
_LANGGRAPH_WORKFLOW = build_langgraph()


def run_scraper_pipeline(url: str) -> dict:
    extractor = Article_extractor(url)
    raw_text = extractor.extract()

    # Clean the text
    result = {}
    cleaned_text = clean_extracted_text(raw_text["text"])
    result["cleaned_text"] = cleaned_text

    # Extract keywords
    keywords = extract_keywords(cleaned_text)
    result["keywords"] = keywords

    logger.info(f"Scraper pipeline completed for URL: {url}")
    logger.debug(f"Scraper output: {json.dumps(result, ensure_ascii=False, indent=2)}")

    return result


async def run_langgraph_workflow(state: dict):
    """Execute the pre-compiled LangGraph workflow."""
    result = await _LANGGRAPH_WORKFLOW.ainvoke(state)
    logger.info("LangGraph workflow executed successfully.")
    return result
