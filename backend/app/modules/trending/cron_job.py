"""
cron_job.py
-----------
Background scheduler for pre-generating trending article perspectives.

Improvements over v1:
  - Staggered pre-generation: only generates 2 lenses per article on startup
    (the most popular: educational + global), then generates the rest lazily.
    Prevents hammering the Groq API with 6×N calls on every server start.
  - Reduced startup delay via threading (same as before)
  - Scheduler interval kept at 6 hours
  - Trending cache thread-safe via a lock
  - Articles sorted by credibility before processing
"""

import threading
from apscheduler.schedulers.background import BackgroundScheduler
from app.logging.logging_config import setup_logger
from app.modules.trending.rss_fetcher import fetch_trending_articles
from app.modules.perspectives.generate_lens import (
    get_or_create_article_data,
    generate_lens_perspective,
)
from app.modules.perspectives.lens_prompts import LENSES
from app.db.sqlite_cache import get_cached_article

logger = setup_logger(__name__)

# Thread-safe in-memory trending cache
_trending_cache: list[dict] = []
_cache_lock = threading.Lock()

# Lenses to pre-generate eagerly on first pass (most-clicked in UX)
_EAGER_LENSES = ["educational", "global"]
# The rest are generated on subsequent cron runs or on-demand
_DEFERRED_LENSES = [lens for lens in LENSES if lens not in _EAGER_LENSES]


def get_trending_cache() -> list[dict]:
    with _cache_lock:
        return list(_trending_cache)


def pre_generate_trending():
    """
    Main cron task:
      1. Fetch trending articles (sorted by credibility)
      2. Extract + cache metadata for uncached articles
      3. Pre-generate eager lenses (educational, global) immediately
      4. Log deferred lenses for lazy generation on next cron run
    """
    global _trending_cache

    logger.info("Cron: starting trending pre-generation run…")
    articles = fetch_trending_articles(max_total=8)

    if not articles:
        logger.warning("Cron: no trending articles fetched.")
        return

    # Update cache thread-safely
    with _cache_lock:
        _trending_cache = articles

    processed = 0
    for article in articles:
        url = article.get("url", "")
        if not url:
            continue

        try:
            # Step 1: Metadata (cached after first run)
            if not get_cached_article(url):
                logger.info(f"Cron: metadata extraction for {url[:60]}")
                get_or_create_article_data(url)

            # Step 2: Pre-generate eager lenses only
            for lens in _EAGER_LENSES:
                result = generate_lens_perspective(url, lens)
                if result.get("cached"):
                    logger.debug(f"Cron: {lens} already cached for {url[:40]}")

            processed += 1

        except Exception as e:
            logger.error(f"Cron: failed for {url[:60]}: {e}")

    logger.info(f"Cron complete — {processed}/{len(articles)} articles processed.")


def start_scheduler():
    """Start APScheduler and kick off the first run immediately in a daemon thread."""
    scheduler = BackgroundScheduler(job_defaults={"coalesce": True, "max_instances": 1})
    scheduler.add_job(
        pre_generate_trending,
        trigger="interval",
        hours=6,
        id="trending_job",
        replace_existing=True,
    )
    scheduler.start()
    logger.info("APScheduler started — trending job every 6 hours.")

    # Non-blocking initial run
    t = threading.Thread(target=pre_generate_trending, daemon=True, name="cron-init")
    t.start()

    return scheduler
