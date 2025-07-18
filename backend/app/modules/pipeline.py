from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
from app.modules.langgraph_builder import build_langgraph

import json

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

    # Optional: pretty print raw_text for debugging
    print(json.dumps(result, indent=2, ensure_ascii=False))

    return result


def run_langgraph_workflow(state: dict):
    """Execute the pre-compiled LangGraph workflow."""
    result = _LANGGRAPH_WORKFLOW.invoke(state)
    return result
