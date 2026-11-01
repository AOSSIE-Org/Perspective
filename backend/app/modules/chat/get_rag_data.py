"""
get_rag_data.py
---------------
Provides functionality to perform semantic search queries on the Pinecone
vector database for Retrieval-Augmented Generation (RAG) workflows.

This module:
    - Loads Pinecone credentials from environment variables.
    - Connects to the Pinecone index named in app.config.
    - Defines `search_pinecone()` to search stored vector embeddings and
      retrieve the most relevant matches.

Functions:
    search_pinecone(query: str, top_k: int = RAG_TOP_K) -> list[dict]:
        Encodes the input query, searches Pinecone for the most similar
        vectors, and returns a list of matches with metadata.

Environment Variables:
    PINECONE_API_KEY (str): API key for authenticating with Pinecone.

Dependencies:
    - app.modules.chat.embed_query (for generating embeddings)
    - pinecone (Pinecone client library)
"""


from pinecone import Pinecone
from dotenv import load_dotenv
from app.modules.chat.embed_query import embed_query
from app.config import PINECONE_INDEX_NAME, PINECONE_NAMESPACE, RAG_TOP_K
import os

load_dotenv()

pc = Pinecone(os.getenv("PINECONE_API_KEY"))
index = pc.Index(PINECONE_INDEX_NAME)


def search_pinecone(query: str, top_k: int = RAG_TOP_K):
    embeddings = embed_query(query)

    results = index.query(
        vector=embeddings, top_k=top_k, include_metadata=True, namespace=PINECONE_NAMESPACE
    )

    matches = []
    for match in results["matches"]:
        matches.append(
            {"id": match["id"], "score": match["score"], "metadata": match["metadata"]}
        )
    return matches
