"""
routes.py
---------
FastAPI routes for the Perspective application.

Optimisations:
    - /process and /bias no longer scrape the article twice.
      /bias now reuses the SQLite article cache populated by /process,
      or does a single scrape if the article hasn't been processed yet.
    - Imports are consolidated (removed duplicate pipeline import).
    - Chat endpoint properly handles missing results.
    - All blocking I/O offloaded with asyncio.to_thread.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline, run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.get_rag_data import search_pinecone
from app.modules.chat.llm_processing import ask_llm
from app.modules.article_extractor.extract_metadata import extract_article_metadata
from app.db.sqlite_cache import save_article_cache, get_cached_article
from app.logging.logging_config import setup_logger
import asyncio

logger = setup_logger(__name__)
router = APIRouter()


class URLRequest(BaseModel):
    url: str


class ChatQuery(BaseModel):
    message: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/bias")
async def bias_detection(request: URLRequest):
    """
    Returns structured bias analysis for an article.
    Reuses cached article text if already scraped — avoids double scraping.
    """
    # Try cache first to avoid redundant scraping
    cached = await asyncio.to_thread(get_cached_article, request.url)
    if cached and cached.get("cleaned_text"):
        text = cached["cleaned_text"]
        logger.info(f"Bias: reusing cached text for {request.url[:60]}")
    else:
        scraped = await asyncio.to_thread(run_scraper_pipeline, request.url)
        text = scraped.get("cleaned_text", "")

    if not text or not text.strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract article content. The site may block scrapers or require a subscription.",
        )

    result = await asyncio.to_thread(check_bias, text)
    logger.info(f"Bias result for {request.url[:60]}: score={result.get('bias_score')}")
    return result


@router.post("/process")
async def run_pipelines(request: URLRequest):
    """
    Full article analysis pipeline:
      1. Scrape + clean article text (smart 40/30/30 sampling)
      2. Run LangGraph workflow (sentiment → fact-check → perspective → store)
      3. Extract + cache article metadata for multi-perspective reuse
    """
    # Step 1: Scrape
    article_text = await asyncio.to_thread(run_scraper_pipeline, request.url)

    if not article_text.get("cleaned_text", "").strip():
        raise HTTPException(
            status_code=422,
            detail="Could not extract article content. The site may block scrapers, require login, or use a paywall.",
        )

    # Step 2: LangGraph
    data = await asyncio.to_thread(run_langgraph_workflow, article_text)

    # Step 3: Cache metadata (non-blocking, non-fatal)
    try:
        if not await asyncio.to_thread(get_cached_article, request.url):
            cleaned = article_text.get("cleaned_text", "")
            metadata = await asyncio.to_thread(extract_article_metadata, cleaned)
            await asyncio.to_thread(
                save_article_cache,
                request.url,
                {**metadata, "cleaned_text": cleaned, "url": request.url},
            )
            logger.info(f"Metadata cached for {request.url[:60]}")
    except Exception as e:
        logger.warning(f"Metadata caching failed (non-fatal): {e}")

    return data


@router.post("/chat")
async def answer_query(request: ChatQuery):
    query = request.message
    if not query.strip():
        return {"answer": "Please provide a question."}

    results = await asyncio.to_thread(search_pinecone, query)
    answer = await asyncio.to_thread(ask_llm, query, results)
    logger.info(f"Chat answered for query: {query[:60]}")
    return {"answer": answer}
