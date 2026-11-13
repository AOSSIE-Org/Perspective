"""
vector_store.py
------------------
Initializes and manages the Pinecone vector database connection for the Perspective API.

This module:
    - Loads Pinecone credentials from environment variables when first needed.
    - Creates the Pinecone index if it does not exist.
    - Connects to the specified index for vector operations.

``index`` and ``pc`` are module-level proxy objects. Importing them (including
``from app.db.vector_store import index``) does not connect to Pinecone; the
client is created on the first attribute access, such as ``index.upsert(...)``.

Attributes:
    INDEX_NAME (str): Name of the Pinecone index used for storing vectors.
    DIMENSIONS (int): Dimensionality of vector embeddings.
    METRIC (str): Similarity metric used for vector comparison.

Raises:
    ValueError: If `PINECONE_API_KEY` is not set when the index is first requested.
    RuntimeError: If Pinecone initialization or index connection fails.
"""

from __future__ import annotations

import os
import threading
from typing import Any, Callable, Optional

from dotenv import load_dotenv

from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

# Load environment variables from .env file (safe at import time; no network).
load_dotenv()

# Constants
INDEX_NAME = "perspective"
DIMENSIONS = 384
METRIC = "cosine"

_pc: Optional[Any] = None
_index: Optional[Any] = None
_init_lock = threading.Lock()


class _LazyProxy:
    """Forward attribute access to a factory result on first real use.

    The factory is not called when the proxy is created or imported, so
    ``from app.db.vector_store import index`` stays cheap and does not
    require Pinecone credentials or network access.
    """

    def __init__(self, factory: Callable[[], Any]) -> None:
        """Store ``factory`` without calling it."""
        object.__setattr__(self, "_factory", factory)

    def __getattr__(self, name: str) -> Any:
        """Resolve the underlying object and return the named attribute."""
        return getattr(object.__getattribute__(self, "_factory")(), name)

    def __setattr__(self, name: str, value: Any) -> None:
        """Resolve the underlying object and set the named attribute."""
        setattr(object.__getattribute__(self, "_factory")(), name, value)

    def __repr__(self) -> str:
        """Return a static description that does not trigger initialization."""
        return f"<LazyProxy factory={object.__getattribute__(self, '_factory').__name__}>"


def get_index() -> Any:
    """Return the Pinecone index, initializing the client and index on first use.

    Importing this module must not require ``PINECONE_API_KEY`` or network access.
    Credential checks and Pinecone API calls happen here, when vector storage or
    retrieval is actually requested.
    """
    global _pc, _index

    if _index is not None:
        return _index

    with _init_lock:
        if _index is not None:
            return _index

        api_key = os.getenv("PINECONE_API_KEY")
        if not api_key:
            raise ValueError("PINECONE_API_KEY environment variable is required")

        try:
            from pinecone import AwsRegion, CloudProvider, Pinecone, ServerlessSpec

            _pc = Pinecone(api_key=api_key)
        except Exception as e:
            raise RuntimeError(
                f"Error occured while intialising pinecone client:{e}"
            ) from e

        if not _pc.has_index(INDEX_NAME):
            logger.info(f"Creating index: {INDEX_NAME}")
            _pc.create_index(
                name=INDEX_NAME,
                dimension=DIMENSIONS,
                metric=METRIC,
                spec=ServerlessSpec(
                    cloud=CloudProvider.AWS, region=AwsRegion.US_EAST_1
                ),
            )
        else:
            logger.info(f"Index '{INDEX_NAME}' already exists")

        try:
            _index = _pc.Index(INDEX_NAME)
        except Exception as e:
            raise RuntimeError(
                f"Error occured while connecting to the index {INDEX_NAME}:{e}"
            ) from e

        return _index


def _get_pc() -> Any:
    """Return the cached Pinecone client, initializing it on first use."""
    get_index()
    return _pc


def reset_index_for_tests() -> None:
    """Clear cached Pinecone client/index state (test helper only)."""
    global _pc, _index
    with _init_lock:
        _pc = None
        _index = None


# Module-level proxies so ``from … import index`` / ``pc`` stay lazy.
index = _LazyProxy(get_index)
pc = _LazyProxy(_get_pc)


def __getattr__(name: str) -> Any:
    """Lazy attribute access for backward-compatible ``PINECONE_API_KEY`` reads."""
    if name == "PINECONE_API_KEY":
        return os.getenv("PINECONE_API_KEY")
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
