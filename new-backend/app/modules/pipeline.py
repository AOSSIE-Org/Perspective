from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
import json


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
