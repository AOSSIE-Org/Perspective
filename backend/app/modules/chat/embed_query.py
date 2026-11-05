"""
embed_query.py
--------------
Provides functionality to generate vector embeddings for text queries using
the Sentence Transformers library.

This module:
    - Loads the pre-trained embedding model named by EMBEDDING_MODEL in app.config.
    - Defines a helper function `embed_query()` to encode a query string into
      a list of numerical embeddings.

Functions:
    embed_query(query: str) -> list[float]:
        Encodes the given query into a numerical vector representation.

Model:
    EMBEDDING_MODEL from app.config (a sentence-transformers model):
        A lightweight transformer model optimized for semantic search and
        similarity tasks.
"""


from sentence_transformers import SentenceTransformer
from app.config import EMBEDDING_MODEL

embedder = SentenceTransformer(EMBEDDING_MODEL)


def embed_query(query: str):
    embeddings = embedder.encode(query).tolist()

    return embeddings
