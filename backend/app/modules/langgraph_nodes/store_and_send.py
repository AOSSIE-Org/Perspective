"""
store_and_send.py
-----------------
Handles chunking, embedding, and storing of data into a vector database.
"""

from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.modules.vector_store.embed import embed_chunks
from app.utils.store_vectors import store
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def store_and_send(state):
    try:
        logger.debug(f"Received state for vector storage: {state}")
        try:
            chunks = chunk_rag_data(state)
            if chunks:
                vectors = embed_chunks(chunks)
                if vectors:
                    logger.info(f"Embedding complete — {len(vectors)} vectors generated.")
                    store(vectors)
                    logger.info("Vectors successfully stored in Pinecone.")
        except Exception as storage_err:
            # Vector storage failure is non-fatal to displaying the analysis result
            logger.warning(f"Vector storage warning: {storage_err}")

    except Exception as e:
        logger.exception(f"Error in store_and_send: {e}")
        return {
            "status": "error",
            "error_from": "store_and_send",
            "message": f"{e}",
        }

    return {**state, "status": "success"}
