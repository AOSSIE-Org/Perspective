"""
sqlite_cache.py
---------------
SQLite cache for article metadata and generated lens perspectives.

Improvements over v1:
  - WAL (Write-Ahead Logging) mode: significantly faster concurrent reads/writes
  - Connection pool via threading.local() — one connection per thread, not per call
  - TTL expiry: articles expire after 7 days, perspectives after 30 days
  - Cache size limit: auto-evicts the oldest articles beyond MAX_ARTICLES
  - Indexes on url_hash + lens for fast lookups
  - PRAGMA optimisations: cache_size, synchronous=NORMAL, temp_store=MEMORY
"""

import sqlite3
import hashlib
import json
import os
import threading
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

DB_PATH = os.path.join(os.path.dirname(__file__), "perspective_cache.db")

# TTL in seconds
ARTICLE_TTL_SECS = 7 * 24 * 3600  # 7 days
PERSPECTIVE_TTL_SECS = 30 * 24 * 3600  # 30 days
MAX_ARTICLES = 500  # evict oldest beyond this

# Thread-local connection pool
_local = threading.local()


def get_connection() -> sqlite3.Connection:
    """
    Return a per-thread SQLite connection.
    Creates the connection with WAL mode and performance PRAGMAs on first use.
    """
    if not hasattr(_local, "conn") or _local.conn is None:
        conn = sqlite3.connect(DB_PATH, check_same_thread=False)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA synchronous=NORMAL")
        conn.execute("PRAGMA cache_size=-8000")  # 8 MB page cache
        conn.execute("PRAGMA temp_store=MEMORY")
        conn.execute("PRAGMA mmap_size=134217728")  # 128 MB memory-mapped I/O
        _local.conn = conn
    return _local.conn


def init_db():
    """Create tables and indexes if they don't already exist."""
    with get_connection() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS article_cache (
                url_hash     TEXT PRIMARY KEY,
                url          TEXT NOT NULL,
                cleaned_text TEXT,
                summary      TEXT,
                main_claim   TEXT,
                entities     TEXT,
                tone         TEXT,
                key_points   TEXT,
                created_at   REAL DEFAULT (strftime('%s','now'))
            );

            CREATE TABLE IF NOT EXISTS perspective_cache (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                url_hash     TEXT NOT NULL,
                lens         TEXT NOT NULL,
                content      TEXT NOT NULL,
                created_at   REAL DEFAULT (strftime('%s','now')),
                UNIQUE(url_hash, lens)
            );

            -- Indexes for fast lookups (idempotent)
            CREATE INDEX IF NOT EXISTS idx_article_hash   ON article_cache(url_hash);
            CREATE INDEX IF NOT EXISTS idx_persp_hash_lens ON perspective_cache(url_hash, lens);
            CREATE INDEX IF NOT EXISTS idx_article_age    ON article_cache(created_at);
        """)
    logger.info("SQLite cache initialised (WAL mode).")


def url_to_hash(url: str) -> str:
    return hashlib.sha256(url.strip().encode()).hexdigest()


# ── Article cache ─────────────────────────────────────────────────────────────


def get_cached_article(url: str) -> dict | None:
    url_hash = url_to_hash(url)
    conn = get_connection()
    row = conn.execute(
        """SELECT * FROM article_cache
           WHERE url_hash = ?
             AND (strftime('%s','now') - created_at) < ?""",
        (url_hash, ARTICLE_TTL_SECS),
    ).fetchone()
    if row:
        data = dict(row)
        data["entities"] = json.loads(data.get("entities") or "[]")
        data["key_points"] = json.loads(data.get("key_points") or "[]")
        return data
    return None


def save_article_cache(url: str, article_data: dict):
    url_hash = url_to_hash(url)
    conn = get_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO article_cache
            (url_hash, url, cleaned_text, summary, main_claim, entities, tone, key_points)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """,
        (
            url_hash,
            url,
            article_data.get("cleaned_text", ""),
            article_data.get("summary", ""),
            article_data.get("main_claim", ""),
            json.dumps(article_data.get("entities", [])),
            article_data.get("tone", ""),
            json.dumps(article_data.get("key_points", [])),
        ),
    )
    conn.commit()
    _evict_old_articles(conn)
    logger.debug(f"Article cached: {url_hash[:12]}…")


def _evict_old_articles(conn: sqlite3.Connection):
    """Delete oldest articles beyond MAX_ARTICLES to keep the DB lean."""
    count = conn.execute("SELECT COUNT(*) FROM article_cache").fetchone()[0]
    if count > MAX_ARTICLES:
        excess = count - MAX_ARTICLES
        conn.execute(
            """
            DELETE FROM article_cache WHERE url_hash IN (
                SELECT url_hash FROM article_cache
                ORDER BY created_at ASC LIMIT ?
            )
        """,
            (excess,),
        )
        conn.commit()
        logger.info(f"Cache eviction: removed {excess} oldest articles")


# ── Perspective cache ─────────────────────────────────────────────────────────


def get_cached_perspective(url: str, lens: str) -> str | None:
    url_hash = url_to_hash(url)
    conn = get_connection()
    row = conn.execute(
        """SELECT content FROM perspective_cache
           WHERE url_hash = ? AND lens = ?
             AND (strftime('%s','now') - created_at) < ?""",
        (url_hash, lens, PERSPECTIVE_TTL_SECS),
    ).fetchone()
    return row["content"] if row else None


def save_perspective_cache(url: str, lens: str, content: str):
    url_hash = url_to_hash(url)
    conn = get_connection()
    conn.execute(
        """
        INSERT OR REPLACE INTO perspective_cache (url_hash, lens, content)
        VALUES (?, ?, ?)
    """,
        (url_hash, lens, content),
    )
    conn.commit()
    logger.debug(f"Perspective cached: lens={lens}, hash={url_hash[:12]}…")


def get_all_cached_perspectives(url: str) -> dict:
    """Return {lens: content} for all non-expired cached lenses for this URL."""
    url_hash = url_to_hash(url)
    conn = get_connection()
    rows = conn.execute(
        """SELECT lens, content FROM perspective_cache
           WHERE url_hash = ?
             AND (strftime('%s','now') - created_at) < ?""",
        (url_hash, PERSPECTIVE_TTL_SECS),
    ).fetchall()
    return {row["lens"]: row["content"] for row in rows}
