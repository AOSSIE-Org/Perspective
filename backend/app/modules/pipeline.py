"""
pipeline.py
-----------
Orchestrates scraping, cleaning, smart text sampling, keyword extraction,
and LangGraph workflow execution for article analysis.
"""

from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
from app.modules.langgraph_builder import build_langgraph
from app.logging.logging_config import setup_logger
import json

logger = setup_logger(__name__)

# Compile once when module loads
_LANGGRAPH_WORKFLOW = build_langgraph()

# Target character budget: ~1800 tokens, safely within Groq TPM limits
_MAX_CHARS = 9000


def _smart_sample(text: str, max_chars: int = _MAX_CHARS) -> str:
    """
    Extract a representative window from article text within `max_chars`.
    Takes 40% from the beginning (intro/thesis), 30% from the middle
    (body/evidence), and 30% from the end (conclusions).
    Far more informative than naive head-truncation.
    """
    if len(text) <= max_chars:
        return text

    head_len = int(max_chars * 0.40)
    mid_len = int(max_chars * 0.30)
    tail_len = max_chars - head_len - mid_len

    head = text[:head_len]
    mid_start = (len(text) - mid_len) // 2
    mid = text[mid_start : mid_start + mid_len]
    tail = text[-tail_len:]

    return (
        head
        + "\n\n...[middle excerpt]...\n\n"
        + mid
        + "\n\n...[end excerpt]...\n\n"
        + tail
    )


def run_scraper_pipeline(url: str) -> dict:
    extractor = Article_extractor(url)
    raw = extractor.extract()

    cleaned_text = clean_extracted_text(raw.get("text", ""))
    sampled_text = _smart_sample(cleaned_text)

    keywords = extract_keywords(sampled_text)

    result = {
        "cleaned_text": sampled_text,
        "full_text_length": len(cleaned_text),
        "keywords": keywords,
        "title": raw.get("title", ""),
        "url": url,
    }

    logger.info(
        f"Scraper pipeline done — url={url} | "
        f"raw={len(cleaned_text)} chars → sampled={len(sampled_text)} chars"
    )
    logger.debug(f"Scraper output: {json.dumps(result, ensure_ascii=False, indent=2)}")
    return result


def run_langgraph_workflow(state: dict):
    """Execute the pre-compiled LangGraph workflow."""
    result = _LANGGRAPH_WORKFLOW.invoke(state)
    logger.info("LangGraph workflow executed successfully.")
    return result
