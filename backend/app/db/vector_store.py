"""
vector_store.py
------------------
Initializes and manages the Pinecone vector database connection for the Perspective API.

This module:
    - Loads Pinecone credentials from environment variables when first needed.
    - Creates the Pinecone index if it does not exist.
    - Connects to the specified index for vector operations.

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
from typing import Any, Optional

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


def reset_index_for_tests() -> None:
    """Clear cached Pinecone client/index state (test helper only)."""
    global _pc, _index
    with _init_lock:
        _pc = None
        _index = None


def __getattr__(name: str) -> Any:
    """Lazy attribute access for backward-compatible ``index`` / ``pc`` imports.

    Note: ``from app.db.vector_store import index`` still triggers initialization.
    Prefer ``get_index()`` at the call site so importing the module stays cheap.
    """
    if name == "index":
        return get_index()
    if name == "pc":
        get_index()
        return _pc
    if name == "PINECONE_API_KEY":
        return os.getenv("PINECONE_API_KEY")
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")
