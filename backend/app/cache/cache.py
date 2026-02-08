"""
cache.py
--------
In-memory caching module for Perspective API responses.

This module provides a thread-safe, TTL-based cache for storing
processed article results, reducing redundant API calls to Groq
and improving response times for repeated URL requests.

Features:
    - TTL-based expiration (configurable via CACHE_TTL_SECONDS)
    - Thread-safe operations using locks
    - LRU-style eviction when max size is reached
    - Configurable via environment variables

Environment Variables:
    CACHE_ENABLED (str): "true" or "false" to enable/disable caching
    CACHE_TTL_SECONDS (int): Time-to-live in seconds (default: 86400 = 24h)
    CACHE_MAX_SIZE (int): Maximum number of cache entries (default: 1000)

Usage:
    from app.cache import cache
    
    # Check cache
    cached = cache.get("process", "https://example.com/article")
    if cached:
        return cached
    
    # Store in cache
    cache.set("process", "https://example.com/article", result)
"""

import hashlib
import os
import threading
import copy
from datetime import datetime, timedelta
from typing import Any, Optional
from collections import OrderedDict
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

load_dotenv()
logger = setup_logger(__name__)


class CacheEntry:
    """Represents a single cache entry with value and expiration time."""
    
    def __init__(self, value: Any, ttl_seconds: int):
        self.value = value
        self.cached_at = datetime.utcnow()
        self.expires_at = self.cached_at + timedelta(seconds=ttl_seconds)
    
    def is_expired(self) -> bool:
        """Check if this cache entry has expired."""
        return datetime.utcnow() > self.expires_at
    
    def to_metadata(self) -> dict:
        """Return cache metadata for response."""
        return {
            "hit": True,
            "cached_at": self.cached_at.isoformat() + "Z",
            "expires_at": self.expires_at.isoformat() + "Z",
        }


class URLCache:
    """
    Thread-safe in-memory cache with TTL expiration.
    
    Uses an OrderedDict for LRU-style eviction when max size is reached.
    """
    
    def __init__(self):
        self._cache: OrderedDict[str, CacheEntry] = OrderedDict()
        self._lock = threading.Lock()
        
        # Load configuration from environment
        self._enabled = os.getenv("CACHE_ENABLED", "true").lower() == "true"
        self._ttl_seconds = int(os.getenv("CACHE_TTL_SECONDS", "86400"))
        self._max_size = int(os.getenv("CACHE_MAX_SIZE", "1000"))
        
        logger.info(
            f"Cache initialized: enabled={self._enabled}, "
            f"ttl={self._ttl_seconds}s, max_size={self._max_size}"
        )
    
    @property
    def enabled(self) -> bool:
        """Check if caching is enabled."""
        return self._enabled
    
    def _generate_key(self, endpoint: str, url: str) -> str:
        """Generate a unique cache key from endpoint and URL."""
        normalized_url = url.strip().lower()
        url_hash = hashlib.sha256(normalized_url.encode()).hexdigest()[:16]
        return f"{endpoint}:{url_hash}"
    
    def get(self, endpoint: str, url: str) -> Optional[dict]:
        """
        Retrieve a cached response if it exists and hasn't expired.
        
        Args:
            endpoint: The API endpoint type ("process" or "bias")
            url: The article URL
            
        Returns:
            Cached response dict with _cache metadata, or None if not found/expired
        """
        if not self._enabled:
            return None
        
        key = self._generate_key(endpoint, url)
        
        with self._lock:
            entry = self._cache.get(key)
            
            if entry is None:
                logger.debug(f"Cache miss for {endpoint}: {url}")
                return None
            
            if entry.is_expired():
                logger.debug(f"Cache expired for {endpoint}: {url}")
                del self._cache[key]
                return None
            
            # Move to end for LRU behavior
            self._cache.move_to_end(key)
            
            logger.info(f"Cache hit for {endpoint}: {url}")
            
            # Return deep copy with cache metadata to prevent mutation
            result = copy.deepcopy(entry.value) if isinstance(entry.value, (dict, list)) else entry.value
            if isinstance(result, dict):
                result["_cache"] = entry.to_metadata()
            
            return result
    
    def set(self, endpoint: str, url: str, value: Any) -> None:
        """
        Store a response in the cache.
        
        Args:
            endpoint: The API endpoint type ("process" or "bias")
            url: The article URL
            value: The response to cache
        """
        if not self._enabled:
            return
        
        key = self._generate_key(endpoint, url)
        
        with self._lock:
            # Evict oldest entries if at max size
            while len(self._cache) >= self._max_size:
                evicted_key, _ = self._cache.popitem(last=False)
                logger.debug(f"Evicted cache entry: {evicted_key}")
            
            safe_value = copy.deepcopy(value) if isinstance(value, (dict, list)) else value
            self._cache[key] = CacheEntry(safe_value, self._ttl_seconds)
            logger.info(f"Cached response for {endpoint}: {url}")
    
    def delete(self, endpoint: str, url: str) -> bool:
        """
        Remove a specific entry from the cache.
        
        Args:
            endpoint: The API endpoint type
            url: The article URL
            
        Returns:
            True if entry was deleted, False if not found
        """
        key = self._generate_key(endpoint, url)
        
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                logger.info(f"Deleted cache entry for {endpoint}: {url}")
                return True
            return False
    
    def clear(self) -> int:
        """
        Clear all cache entries.
        
        Returns:
            Number of entries cleared
        """
        with self._lock:
            count = len(self._cache)
            self._cache.clear()
            logger.info(f"Cleared {count} cache entries")
            return count
    
    def stats(self) -> dict:
        """
        Get cache statistics.
        
        Returns:
            Dict with cache stats
        """
        with self._lock:
            # Count expired entries
            expired = sum(1 for e in self._cache.values() if e.is_expired())
            
            return {
                "enabled": self._enabled,
                "total_entries": len(self._cache),
                "expired_entries": expired,
                "active_entries": len(self._cache) - expired,
                "max_size": self._max_size,
                "ttl_seconds": self._ttl_seconds,
            }


# Singleton instance
_cache_instance: Optional[URLCache] = None


def get_cache() -> URLCache:
    """Get or create the singleton cache instance."""
    global _cache_instance
    if _cache_instance is None:
        _cache_instance = URLCache()
    return _cache_instance
