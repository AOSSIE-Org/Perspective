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
        logger.info(f"Successfully stored {len(vectors)} "
                    f"vectors in namespace '{namespace}'")
    except Exception as e:
        logger.error("Failed to store "
                     f"vectors in namespace '{namespace}': {e}")
        raise RuntimeError(f"Vector storage failed: {e}")
