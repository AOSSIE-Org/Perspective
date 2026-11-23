"""
cache.py
--------
Thread-safe in-memory cache for dynamic trending topics with TTL and
stale-while-revalidate semantics.
"""

import time
import threading
from typing import Any, Dict, List, Optional
from app.config import TRENDING_CACHE_TTL_SECONDS
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


class TrendingCache:
    """Thread-safe in-memory cache for trending topics."""

    def __init__(self, ttl_seconds: int = TRENDING_CACHE_TTL_SECONDS):
        self._ttl_seconds = ttl_seconds
        self._topics: List[Dict[str, Any]] = []
        self._last_updated: float = 0.0
        self._lock = threading.Lock()
        self._is_refreshing: bool = False

    def get(self) -> Optional[List[Dict[str, Any]]]:
        """Returns cached topics if populated, otherwise None."""
        with self._lock:
            if not self._topics:
                return None
            return list(self._topics)

    def is_stale(self) -> bool:
        """Checks whether the cache has exceeded its TTL."""
        with self._lock:
            if not self._topics:
                return True
            return (time.time() - self._last_updated) > self._ttl_seconds

    def set(self, topics: List[Dict[str, Any]]) -> None:
        """Updates the cache with new topics."""
        with self._lock:
            self._topics = list(topics)
            self._last_updated = time.time()
            self._is_refreshing = False
            logger.info(f"Trending cache updated with {len(topics)} topics.")

    @property
    def is_refreshing(self) -> bool:
        """Indicates if an asynchronous refresh is currently running."""
        with self._lock:
            return self._is_refreshing

    def mark_refreshing(self) -> bool:
        """
        Attempts to acquire the refresh flag.
        Returns True if this caller successfully set the flag,
        or False if a refresh is already in progress.
        """
        with self._lock:
            if self._is_refreshing:
                return False
            self._is_refreshing = True
            return True

    def clear(self) -> None:
        """Clears the cache (useful for tests)."""
        with self._lock:
            self._topics = []
            self._last_updated = 0.0
            self._is_refreshing = False


# Global instance
trending_cache = TrendingCache()

