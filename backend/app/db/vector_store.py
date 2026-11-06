"""
vector_store.py
------------------
Manages the Pinecone vector database connection for the Perspective API.

The client and index are created lazily by get_index(), on the first vector
operation rather than at import. Importing this module never requires
credentials or network access, so the API can start while Pinecone is
unconfigured or unreachable; a missing key or a failed connection is then
reported where storage is actually requested, which is also what lets the
pipeline treat vector failures as non-fatal.

Functions:
    get_index()
        Returns the connected Pinecone index, creating the client and the
        index itself on first call. The handle is cached and initialization
        is serialized so concurrent first callers connect once.

The index name, dimensions, metric, cloud, region and readiness timeouts
come from app.config.

Raises:
    ValueError: If `PINECONE_API_KEY` is not set when a connection is requested.
    RuntimeError: If Pinecone initialization or index connection fails.
"""

import os
import threading
import time
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from app.logging.logging_config import setup_logger
from app.config import (
    PINECONE_CLOUD,
    PINECONE_DIMENSIONS,
    PINECONE_INDEX_NAME,
    PINECONE_INDEX_READY_POLL_SECONDS,
    PINECONE_INDEX_READY_TIMEOUT_SECONDS,
    PINECONE_METRIC,
    PINECONE_REGION,
)

logger = setup_logger(__name__)

# Load environment variables from .env file
load_dotenv()

_index = None
# Sync callers can reach get_index() concurrently through the threadpool;
# without a lock every first caller would try to create the index.
_index_lock = threading.Lock()


def get_index():
    """
    Connect to the Pinecone index on first use and cache the handle.

    A failed attempt caches nothing, so the next call retries the connection
    instead of reusing a half-initialized state.
    """
    global _index
    if _index is not None:
        return _index
    with _index_lock:
        if _index is None:
            _index = _connect_index()
    return _index


def _connect_index():
    """Open the client, ensure the index exists and return a handle to it."""
    api_key = os.getenv("PINECONE_API_KEY")
    if not api_key:
        raise ValueError("PINECONE_API_KEY environment variable is required")
    try:
        pc = Pinecone(api_key=api_key)
    except Exception as e:
        raise RuntimeError(f"Error occured while intialising pinecone client:{e}")

    try:
        # Create index if it doesn't exist
        if not pc.has_index(PINECONE_INDEX_NAME):
            logger.info(f"Creating index: {PINECONE_INDEX_NAME}")
            pc.create_index(
                name=PINECONE_INDEX_NAME,
                dimension=PINECONE_DIMENSIONS,
                metric=PINECONE_METRIC,
                spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
            )
            _wait_until_ready(pc)
        else:
            logger.info(f"Index '{PINECONE_INDEX_NAME}' already exists")
    except Exception as e:
        raise RuntimeError(
            f"Error occured while preparing the index {PINECONE_INDEX_NAME}:{e}"
        )

    try:
        return pc.Index(PINECONE_INDEX_NAME)
    except Exception as e:
        raise RuntimeError(
            f"Error occured while connecting to the index {PINECONE_INDEX_NAME}:{e}"
        )


def _wait_until_ready(pc) -> None:
    """
    Wait for a newly created index to finish provisioning, up to a deadline.

    Serverless indexes accept writes only once ready, and the SDK reports
    readiness through describe_index; an SDK that exposes no ready flag is
    not blocked on.
    """
    deadline = time.monotonic() + PINECONE_INDEX_READY_TIMEOUT_SECONDS
    while True:
        status = getattr(pc.describe_index(PINECONE_INDEX_NAME), "status", None)
        ready = getattr(
            status, "ready", status.get("ready") if isinstance(status, dict) else True
        )
        if ready is not False:
            return
        if time.monotonic() >= deadline:
            raise RuntimeError(
                f"Index {PINECONE_INDEX_NAME} was still not ready after "
                f"{PINECONE_INDEX_READY_TIMEOUT_SECONDS} seconds"
            )
        time.sleep(PINECONE_INDEX_READY_POLL_SECONDS)
