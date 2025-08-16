"""
store_vectors.py
----------------
Provides a utility for persisting vector embeddings into a Pinecone index.

Functions:
    store(vectors: List[Dict[str, Any]], namespace: str = "default") -> None
        - Validates and upserts a batch of vector embeddings into the 
          configured Pinecone namespace.
        - Parameters:
            vectors: List of dictionaries containing 'id', 'values', and 'metadata'.
            namespace: Target namespace in Pinecone (default is "default").
        - Raises:
            ValueError: If the vectors list is empty or malformed.
            RuntimeError: If the upsert operation to Pinecone fails.

Notes:
    - Logs success and failure events for monitoring.
    - Intended to be used after generating embeddings via 
      the embed.py module before retrieval/semantic search.
"""


from app.db.vector_store import index


from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


def store(vectors: List[Dict[str, Any]], namespace: str = "default") -> None:
    """
    Store vectors in the Pinecone index.

    Args:
        vectors: List of vector dictionaries to upsert
        namespace: Namespace to store vectors in (default: "default")

    Raises:
        ValueError: If vectors is empty or invalid
        RuntimeError: If upsert operation fails
    """
    if not vectors:
        raise ValueError("Vectors list cannot be empty")

    try:
        index.upsert(vectors, namespace=namespace)
        logger.info(
            f"Successfully stored {len(vectors)} vectors in namespace '{namespace}'"
        )
    except Exception as e:
        logger.error(f"Failed to store vectors in namespace '{namespace}': {e}")
        raise RuntimeError(f"Vector storage failed: {e}")
