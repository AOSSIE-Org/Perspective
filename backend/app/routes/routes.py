"""
routes.py
---------
Defines the FastAPI API routes for the Perspective application, exposing endpoints
for bias detection, article processing, and chat-based querying over stored RAG data.

Endpoints:
    GET /
        Health check endpoint confirming the API is live.

    POST /bias
        Accepts a URL, scrapes and processes the article content, and runs bias detection
        to return a bias score and related insights.

    POST /process
        Accepts a URL, scrapes and processes the article content, then executes the
        LangGraph workflow for sentiment analysis, fact-checking, perspective generation,
        and final result assembly.

    POST /chat
        Accepts a user query, searches stored vector data in Pinecone, and queries an LLM
        to produce a contextual answer.

Core Components:
    - run_scraper_pipeline: Extracts and cleans article text, then identifies keywords.
    - run_langgraph_workflow: Executes the LangGraph pipeline for deep content analysis.
    - check_bias: Scores and analyzes potential bias in article content.
    - search_pinecone: Retrieves relevant RAG data for a given query.
    - ask_llm: Generates a natural language answer using retrieved context.
"""


from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel
from app.modules.scraper.safe_fetch import UnsafeURLError, validate_public_url
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.get_rag_data import search_pinecone
from app.modules.chat.llm_processing import ask_llm
from app.modules.trending.cache import trending_cache
from app.modules.trending.feed_parser import fetch_rss_stories
from app.modules.trending.evaluator import evaluate_and_generate_topics
from app.logging.logging_config import setup_logger
import asyncio
import json

logger = setup_logger(__name__)

router = APIRouter()


class URlRequest(BaseModel):
    url: str


class ChatQuery(BaseModel):
    message: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


async def require_public_url(url: str) -> None:
    """Reject URLs that are not public http(s) pages before any scraping starts."""
    try:
        await asyncio.to_thread(validate_public_url, url)
    except UnsafeURLError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/bias")
async def bias_detection(request: URlRequest):
    await require_public_url(request.url)
    content = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    bias_score = await asyncio.to_thread(check_bias, (content))
    logger.info(f"Bias detection result: {bias_score}")
    return bias_score


@router.post("/process")
async def run_pipelines(request: URlRequest):
    await require_public_url(request.url)
    article_text = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    logger.debug(f"Scraper output: {json.dumps(article_text, indent=2, ensure_ascii=False)}")
    data = await asyncio.to_thread(run_langgraph_workflow, (article_text))
    return data


@router.post("/chat")
async def answer_query(request: ChatQuery):
    query = request.message
    results = search_pinecone(query)
    answer = ask_llm(query, results)
    logger.info(f"Chat answer generated: {answer}")

    return {"answer": answer}


async def refresh_trending_in_background():
    """Background task to fetch and evaluate fresh trending stories."""
    if not trending_cache.mark_refreshing():
        return
    try:
        stories = await asyncio.to_thread(fetch_rss_stories)
        if stories:
            topics = await asyncio.to_thread(evaluate_and_generate_topics, stories)
            if topics:
                trending_cache.set(topics)
    except Exception as e:
        logger.error(f"Failed to refresh trending topics in background: {e}")
    finally:
        if trending_cache.is_refreshing:
            trending_cache.clear()


@router.get("/trending")
async def get_trending_topics(background_tasks: BackgroundTasks):
    """
    Returns dynamically ingested and evaluated trending topics.
    Serves from in-memory cache; triggers background refresh if stale or empty.
    """
    cached = trending_cache.get()
    if cached:
        if trending_cache.is_stale():
            background_tasks.add_task(refresh_trending_in_background)
        return {"status": "success", "topics": cached}

    stories = await asyncio.to_thread(fetch_rss_stories)
    if stories:
        topics = await asyncio.to_thread(evaluate_and_generate_topics, stories)
        if topics:
            trending_cache.set(topics)
            return {"status": "success", "topics": topics}

    return {"status": "success", "topics": []}
