"""
Cache module for Perspective API.

Provides in-memory caching for API responses to reduce redundant
LLM API calls and improve response times.

Usage:
    from app.cache import cache
    
    # Check for cached response
    cached = cache.get("process", url)
    if cached:
        return cached
    
    # Store response in cache
    cache.set("process", url, result)
"""

from app.cache.cache import get_cache, URLCache

# Export singleton cache instance
cache = get_cache()

__all__ = ["cache", "get_cache", "URLCache"]
