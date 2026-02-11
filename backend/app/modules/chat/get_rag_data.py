"""
get_rag_data.py
---------------
Provides functionality to perform semantic search queries on the Pinecone
vector database for Retrieval-Augmented Generation (RAG) workflows.

This module:
    - Loads Pinecone credentials from environment variables.
    - Connects to the "perspective" index in Pinecone.
    - Defines `search_pinecone()` to search stored vector embeddings and
      retrieve the most relevant matches.

Functions:
    search_pinecone(query: str, top_k: int = 5) -> list[dict]:
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
import os

load_dotenv()

pc = Pinecone(api_key=os.getenv("PINECONE_API_KEY"))
index = pc.Index("perspective")


def search_pinecone(query: str, top_k: int = 5):
    embeddings = embed_query(query)

    results = index.query(
        vector=embeddings, top_k=top_k, include_metadata=True, namespace="default"
    )

    matches = []
    for match in results["matches"]:
        matches.append(
            {"id": match["id"], "score": match["score"], "metadata": match["metadata"]}
        )
    return matches
