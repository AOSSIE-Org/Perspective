"""
get_rag_data.py
---------------
Provides functionality to perform semantic search queries on the Pinecone
vector database for Retrieval-Augmented Generation (RAG) workflows.

This module:
    - Defines `search_pinecone()` to search stored vector embeddings and
      retrieve the most relevant matches.
    - Connects through app.db.vector_store.get_index(), which opens the
      Pinecone connection lazily on the first store or search instead of at
      import, so a missing PINECONE_API_KEY does not stop the API from
      starting.

Functions:
    search_pinecone(query: str, top_k: int = RAG_TOP_K) -> list[dict]:
        Encodes the input query, searches Pinecone for the most similar
        vectors, and returns a list of matches with metadata.

Environment Variables:
    PINECONE_API_KEY (str): API key for authenticating with Pinecone.

Dependencies:
    - app.modules.chat.embed_query (for generating embeddings)
    - app.db.vector_store (for the shared Pinecone index connection)
"""


from app.db.vector_store import get_index
from app.modules.chat.embed_query import embed_query
from app.config import PINECONE_NAMESPACE, RAG_TOP_K


def search_pinecone(query: str, top_k: int = RAG_TOP_K):
    embeddings = embed_query(query)

    results = get_index().query(
        vector=embeddings, top_k=top_k, include_metadata=True, namespace=PINECONE_NAMESPACE
    )

    matches = []
    for match in results["matches"]:
        matches.append(
            {"id": match["id"], "score": match["score"], "metadata": match["metadata"]}
        )
    return matches
