"""
embed.py
--------
Module for generating vector embeddings from structured text chunks
using a pre-trained SentenceTransformer model.

Workflow:
    1. Validates that each chunk is a dictionary containing the 'text'
       field.
    2. Extracts all chunk texts and generates embeddings using the
       "all-MiniLM-L6-v2" model.
    3. Packages each embedding with its corresponding chunk ID and
       metadata for downstream storage in a vector database.

This enables semantic search, similarity comparison, and contextual
retrieval in RAG (Retrieval-Augmented Generation) pipelines.

Functions:
    embed_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]
        Generates and returns a list of embedding dictionaries with
        associated IDs and metadata.
"""


from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any

embedder = SentenceTransformer("all-MiniLM-L6-v2")


def embed_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not chunks:
        return []

    # Validate chunk structure
    for i, chunk in enumerate(chunks):
        if not isinstance(chunk, dict) or "text" not in chunk:
            raise ValueError(
                f"Invalid chunk structure at index {i}: missing 'text' field"
            )

    texts = [chunk["text"] for chunk in chunks]
    embeddings = embedder.encode(texts).tolist()

    vectors = []
    for chunk, embedding in zip(chunks, embeddings):
        vectors.append(
            {"id": chunk["id"], "values": embedding, "metadata": chunk["metadata"]}
        )
    return vectors
