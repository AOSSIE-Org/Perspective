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
        to return a bias score and related insights. Results are cached for faster
        repeated requests.

    POST /process
        Accepts a URL, scrapes and processes the article content, then executes the
        LangGraph workflow for sentiment analysis, fact-checking, perspective generation,
        and final result assembly. Results are cached for faster repeated requests.

    POST /chat
        Accepts a user query, searches stored vector data in Pinecone, and queries an LLM
        to produce a contextual answer.

    GET /cache/stats
        Returns cache statistics including hit rates and entry counts.

Core Components:
    - run_scraper_pipeline: Extracts and cleans article text, then identifies keywords.
    - run_langgraph_workflow: Executes the LangGraph pipeline for deep content analysis.
    - check_bias: Scores and analyzes potential bias in article content.
    - search_pinecone: Retrieves relevant RAG data for a given query.
    - ask_llm: Generates a natural language answer using retrieved context.
    - cache: In-memory cache for API responses to reduce LLM API calls.
"""


from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.get_rag_data import search_pinecone
from app.modules.chat.llm_processing import ask_llm
from app.cache import cache
from app.logging.logging_config import setup_logger
import asyncio
import json
import os
import hashlib
from pathlib import Path

logger = setup_logger(__name__)

router = APIRouter()

# Admin API key for destructive cache operations (set via environment variable)
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")


class URlRequest(BaseModel):
    url: str


class ChatQuery(BaseModel):
    message: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


# Directory for saving cache hit responses
CACHE_RESPONSES_DIR = Path(__file__).parent.parent.parent / "cache_responses"
CACHE_RESPONSES_DIR.mkdir(exist_ok=True)
CACHE_RESPONSES_MAX_FILES = 100  # Max files to keep


async def _cleanup_old_cache_files() -> None:
    """Remove oldest cache files if exceeding max limit."""
    try:
        files = list(CACHE_RESPONSES_DIR.glob("*.json"))
        if len(files) > CACHE_RESPONSES_MAX_FILES:
            # Sort by modification time (oldest first)
            files.sort(key=lambda f: f.stat().st_mtime)
            # Remove oldest files to stay under limit
            files_to_remove = files[:len(files) - CACHE_RESPONSES_MAX_FILES]
            for f in files_to_remove:
                f.unlink()
                logger.debug(f"Evicted old cache file: {f.name}")
    except Exception as e:
        logger.error(f"Failed to cleanup cache files: {e}")


async def _save_cache_response(url: str, response: dict) -> None:
    """Save cache hit response to a local JSON file."""
    try:
        # Create filename from URL hash
        url_hash = hashlib.sha256(url.encode()).hexdigest()[:12]
        filename = f"{url_hash}.json"
        filepath = CACHE_RESPONSES_DIR / filename
        
        # Custom JSON encoder for Pydantic and other non-serializable objects
        def json_serializer(obj):
            if hasattr(obj, "model_dump"):  # Pydantic v2
                return obj.model_dump()
            if hasattr(obj, "dict"):  # Pydantic v1
                return obj.dict()
            return str(obj)
        
        # Save response as formatted JSON
        json_content = json.dumps(response, indent=2, ensure_ascii=False, default=json_serializer)
        await asyncio.to_thread(
            lambda: filepath.write_text(json_content, encoding="utf-8")
        )
        logger.info(f"Saved cache response to: {filepath}")
        
        # Cleanup old files if over limit
        await _cleanup_old_cache_files()
    except Exception as e:
        logger.error(f"Failed to save cache response: {e}")


@router.post("/bias")
async def bias_detection(request: URlRequest):
    # Check cache first
    cached_response = cache.get("bias", request.url)
    if cached_response:
        logger.info(f"Returning cached bias result for: {request.url}")
        return cached_response

    # Process if not cached
    content = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    bias_score = await asyncio.to_thread(check_bias, (content))
    logger.info(f"Bias detection result: {bias_score}")

    # Store in cache (only if successful)
    if bias_score.get("status") == "success":
        cache.set("bias", request.url, bias_score)

    # Add cache miss metadata
    bias_score["_cache"] = {"hit": False}
    return bias_score


@router.post("/process")
async def run_pipelines(request: URlRequest):
    # Check cache first
    cached_response = cache.get("process", request.url)
    if cached_response:
        logger.info(f"Returning cached process result for: {request.url}")
        # Auto-save cache hit response to local JSON file
        await _save_cache_response(request.url, cached_response)
        return cached_response

    # Process if not cached
    article_text = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    logger.debug(f"Scraper output: {json.dumps(article_text, indent=2, ensure_ascii=False)}")
    data = await run_langgraph_workflow(article_text)

    # Store in cache (only if successful)
    if isinstance(data, dict) and data.get("status") == "success":
        cache.set("process", request.url, data)

    # Add cache miss metadata
    if isinstance(data, dict):
        data["_cache"] = {"hit": False}
    return data


@router.post("/chat")
async def answer_query(request: ChatQuery):
    query = request.message
    results = search_pinecone(query)
    answer = ask_llm(query, results)
    logger.info(f"Chat answer generated: {answer}")

    return {"answer": answer}


@router.get("/cache/stats")
async def cache_stats():
    """Return cache statistics."""
    return cache.stats()


@router.delete("/cache/clear")
async def cache_clear(x_admin_key: str = Header(None, alias="X-Admin-Key")):
    """Clear all cache entries. Requires X-Admin-Key header."""
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid or missing admin key")
    count = cache.clear()
    logger.info(f"Cache cleared: {count} entries removed")
    return {"message": f"Cleared {count} cache entries", "cleared": count}


@router.delete("/cache/{endpoint}")
async def cache_delete(
    endpoint: str, 
    request: URlRequest,
    x_admin_key: str = Header(None, alias="X-Admin-Key")
):
    """
    Delete a specific cache entry. Requires X-Admin-Key header.
    
    Args:
        endpoint: The endpoint type ("process" or "bias")
        request: The URL request containing the article URL
    """
    if not ADMIN_API_KEY or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid or missing admin key")
    
    if endpoint not in ["process", "bias"]:
        return {"error": "Invalid endpoint. Use 'process' or 'bias'", "deleted": False}
    
    deleted = cache.delete(endpoint, request.url)
    if deleted:
        logger.info(f"Cache entry deleted for {endpoint}: {request.url}")
        return {"message": f"Deleted cache entry for {endpoint}", "deleted": True}
    else:
        return {"message": "Cache entry not found", "deleted": False}
