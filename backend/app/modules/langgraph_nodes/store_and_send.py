"""
store_and_send.py
-----------------
Handles chunking, embedding, and storing of data into a vector database.

Workflow:
    1. Chunk raw data for retrieval-augmented generation (RAG).
    2. Generate embeddings for the chunks.
    3. Store the vectors in a vector database (Pinecone).
    4. Return the updated pipeline state.

Functions:
    store_and_send(state: dict) -> dict:
        Processes the given state through chunking, embedding, and storage.
"""


from app.modules.vector_store.chunk_rag_data import chunk_rag_data
from app.modules.vector_store.embed import embed_chunks
from app.utils.store_vectors import store
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def store_and_send(state):
    # to store data in vector db
    try:
        logger.debug(f"Received state for vector storage: {state}")
        try:
            chunks = chunk_rag_data(state)
        except KeyError as e:
            raise Exception(f"Missing required data field for chunking: {e}")
        except Exception as e:
            raise Exception(f"Failed to chunk data: {e}")
        try:
            vectors = embed_chunks(chunks)
            if vectors:
                logger.info(f"Embedding complete — {len(vectors)} vectors generated.")
        except Exception as e:
            raise Exception(f"failed to embed chunks: {e}")
        
        store(vectors)
        logger.info("Vectors successfully stored in Pinecone.")

    except Exception as e:
        logger.exception(f"Error in store_and_send: {e}")
        return {
            "status": "error",
            "error_from": "store_and_send",
            "message": f"{e}",
        }
    #  sending to frontend
    return {**state, "status": "success"}
