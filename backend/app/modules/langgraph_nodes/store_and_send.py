"""
store_and_send.py
-----------------
Chunks, embeds and stores the pipeline result in the Pinecone vector database.

Improvements:
    - Flattened the nested try/except pyramid into clear sequential steps
    - Pinecone storage failure is non-fatal: pipeline still returns results
      even if vector storage fails (reduces user-facing errors)
    - Cleaner log messages with counts
"""

from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.modules.vector_store.embed import embed_chunks
from app.utils.store_vectors import store
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def store_and_send(state: dict) -> dict:
    """
    Store pipeline results in Pinecone for RAG retrieval.
    Vector storage failure is non-fatal — results are still returned.
    """
    try:
        chunks = chunk_rag_data(state)
    except (KeyError, Exception) as e:
        logger.error(f"Chunking failed: {e} — skipping vector storage")
        return {**state, "status": "success"}  # non-fatal

    try:
        vectors = embed_chunks(chunks)
        logger.info(f"Embedded {len(vectors)} vectors")
    except Exception as e:
        logger.error(f"Embedding failed: {e} — skipping vector storage")
        return {**state, "status": "success"}  # non-fatal

    try:
        store(vectors)
        logger.info("Vectors stored in Pinecone.")
    except Exception as e:
        logger.error(f"Pinecone storage failed: {e} — results still returned")
        return {**state, "status": "success"}  # non-fatal

    return {**state, "status": "success"}
