"""
generate_lens.py
----------------
Generates a multi-perspective analysis for a given article URL and lens.

Flow:
    1. Check perspective_cache in SQLite → return instantly if found.
    2. Check article_cache → load cached metadata.
    3. If article not cached, run scraper pipeline + extract metadata → save to cache.
    4. Build lens-specific prompt → call Groq LLM.
    5. Save result to perspective_cache.
    6. Return generated content.
"""

import os
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger
from app.db.sqlite_cache import (
    get_cached_article,
    get_cached_perspective,
    save_article_cache,
    save_perspective_cache,
)
from app.modules.perspectives.lens_prompts import build_lens_prompt, LensType, LENS_META
from app.modules.article_extractor.extract_metadata import extract_article_metadata
from app.modules.pipeline import run_scraper_pipeline

load_dotenv()
logger = setup_logger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def get_or_create_article_data(url: str) -> dict:
    """Return cached article data or scrape + extract + cache it fresh."""
    cached = get_cached_article(url)
    if cached:
        logger.info(f"Article cache HIT for {url[:50]}")
        return cached

    logger.info(f"Article cache MISS — scraping {url[:50]}")
    pipeline_result = run_scraper_pipeline(url)
    cleaned_text = pipeline_result.get("cleaned_text", "")

    metadata = extract_article_metadata(cleaned_text)
    article_data = {**metadata, "cleaned_text": cleaned_text, "url": url}

    save_article_cache(url, article_data)
    return article_data


def generate_lens_perspective(url: str, lens: LensType) -> dict:
    """
    Generate and cache a perspective for the given article URL and lens.

    Returns:
        {
            "lens": str,
            "content": str,
            "cached": bool,
            "article_metadata": dict,
        }
    """
    if lens not in LENS_META:
        return {
            "error": f"Unknown lens: {lens}. Valid lenses: {list(LENS_META.keys())}"
        }

    # 1. Check perspective cache
    cached_content = get_cached_perspective(url, lens)
    if cached_content:
        logger.info(f"Perspective cache HIT — lens={lens}, url={url[:50]}")
        article_data = get_cached_article(url) or {}
        return {
            "lens": lens,
            "lens_label": LENS_META[lens]["label"],
            "content": cached_content,
            "cached": True,
            "article_metadata": {
                k: article_data.get(k)
                for k in ["summary", "main_claim", "entities", "tone", "key_points"]
            },
        }

    # 2. Get (or create) article data
    article_data = get_or_create_article_data(url)

    # 3. Build and call LLM
    prompt = build_lens_prompt(lens, article_data)
    logger.info(f"Generating {lens} perspective for {url[:50]}")

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=800,
        )
        content = response.choices[0].message.content.strip()
    except Exception as e:
        logger.exception(f"LLM error generating {lens} perspective: {e}")
        return {"error": str(e), "lens": lens}

    # 4. Cache the result
    save_perspective_cache(url, lens, content)

    return {
        "lens": lens,
        "lens_label": LENS_META[lens]["label"],
        "content": content,
        "cached": False,
        "article_metadata": {
            k: article_data.get(k)
            for k in ["summary", "main_claim", "entities", "tone", "key_points"]
        },
    }
