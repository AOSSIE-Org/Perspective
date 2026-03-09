"""
perspective_routes.py
---------------------
FastAPI router exposing the Multi-Perspective and Trending endpoints.

Endpoints:
    POST /api/perspective/generate
        Body: { "url": str, "lens": str }
        Returns a generated or cached perspective for the article from the given lens.

    GET /api/perspective/metadata
        Query: ?url=<url>
        Returns cached article metadata (summary, entities, tone, key_points, main_claim).

    GET /api/trending
        Returns the latest list of trending articles fetched by the cron job.

    GET /api/perspective/lenses
        Returns the list of available lens types with their metadata (label, icon, color).
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.modules.perspectives.generate_lens import (
    generate_lens_perspective,
    get_or_create_article_data,
)
from app.modules.perspectives.lens_prompts import LENSES, LENS_META
from app.modules.trending.cron_job import get_trending_cache
from app.db.sqlite_cache import get_all_cached_perspectives
from app.logging.logging_config import setup_logger
import asyncio

logger = setup_logger(__name__)
router = APIRouter()


class PerspectiveRequest(BaseModel):
    url: str
    lens: str


@router.post("/perspective/generate")
async def generate_perspective_endpoint(request: PerspectiveRequest):
    """Generate or retrieve a cached perspective for the given URL and lens."""
    url = request.url.strip()
    lens = request.lens.strip().lower()

    if not url:
        raise HTTPException(status_code=400, detail="URL is required")
    if lens not in LENSES:
        raise HTTPException(
            status_code=400, detail=f"Invalid lens '{lens}'. Valid lenses: {LENSES}"
        )

    logger.info(f"Perspective request — lens={lens}, url={url[:60]}")
    result = await asyncio.to_thread(generate_lens_perspective, url, lens)

    if "error" in result:
        raise HTTPException(status_code=500, detail=result["error"])

    return result


@router.get("/perspective/metadata")
async def get_article_metadata(url: str):
    """Return cached article metadata, or extract it fresh."""
    if not url:
        raise HTTPException(status_code=400, detail="url query param is required")

    data = await asyncio.to_thread(get_or_create_article_data, url)
    return {
        "url": url,
        "summary": data.get("summary", ""),
        "main_claim": data.get("main_claim", ""),
        "entities": data.get("entities", []),
        "tone": data.get("tone", ""),
        "key_points": data.get("key_points", []),
        "cached_lenses": list(get_all_cached_perspectives(url).keys()),
    }


@router.get("/perspective/lenses")
async def list_lenses():
    """Return all available perspective lenses with UI metadata."""
    return {
        "lenses": [
            {
                "id": lens_id,
                **meta,
            }
            for lens_id, meta in LENS_META.items()
        ]
    }


@router.get("/trending")
async def get_trending():
    """Return the latest trending articles from the cron-job cache."""
    articles = get_trending_cache()
    # Enrich with which lenses are already cached
    enriched = []
    for article in articles:
        cached_lenses = list(get_all_cached_perspectives(article["url"]).keys())
        enriched.append({**article, "cached_lenses": cached_lenses})
    return {"articles": enriched}
