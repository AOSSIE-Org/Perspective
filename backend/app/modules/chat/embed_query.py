"""
embed_query.py
--------------
Provides functionality to generate vector embeddings for text queries using
the Sentence Transformers library.

This module:
    - Loads a pre-trained "all-MiniLM-L6-v2" model.
    - Defines a helper function `embed_query()` to encode a query string into
      a list of numerical embeddings.

Functions:
    embed_query(query: str) -> list[float]:
        Encodes the given query into a numerical vector representation.

Model:
    all-MiniLM-L6-v2 (from sentence-transformers):
        A lightweight transformer model optimized for semantic search and
        similarity tasks.
"""


from sentence_transformers import SentenceTransformer

embedder = SentenceTransformer("all-MiniLM-L6-v2")


def embed_query(query: str):
    embeddings = embedder.encode(query).tolist()

    return embeddings
