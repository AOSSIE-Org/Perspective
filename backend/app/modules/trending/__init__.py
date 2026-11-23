"""
Trending module package initialization.
"""
from app.modules.trending.cache import TrendingCache, trending_cache
from app.modules.trending.feed_parser import fetch_rss_stories
from app.modules.trending.evaluator import evaluate_and_generate_topics

__all__ = [
    "TrendingCache",
    "trending_cache",
    "fetch_rss_stories",
    "evaluate_and_generate_topics",
]

