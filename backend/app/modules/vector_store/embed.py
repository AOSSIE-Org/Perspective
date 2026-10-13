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


from typing import List, Dict, Any, Optional, TYPE_CHECKING

if TYPE_CHECKING:
    from sentence_transformers import SentenceTransformer

_embedder: Optional[Any] = None


def get_embedder():
    """Return the cached SentenceTransformer instance, initializing it lazily on first access."""
    global _embedder
    if _embedder is None:
        from sentence_transformers import SentenceTransformer

        _embedder = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedder


def __getattr__(name: str) -> Any:
    """Maintain backward compatibility for callers importing `embedder` directly."""
    if name == "embedder":
        return get_embedder()
    raise AttributeError(f"module '{__name__}' has no attribute '{name}'")


def embed_chunks(chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    if not chunks:
        return []

    # Validate chunk structure
    required_fields = ("id", "text", "metadata")
    for i, chunk in enumerate(chunks):
        if not isinstance(chunk, dict):
            raise ValueError(
                f"Invalid chunk structure at index {i}: expected dict, got {type(chunk).__name__}"
            )
        for field in required_fields:
            if field not in chunk:
                raise ValueError(
                    f"Invalid chunk structure at index {i}: missing '{field}' field"
                )

    texts = [chunk["text"] for chunk in chunks]
    embedder = get_embedder()
    embeddings = embedder.encode(texts).tolist()

    vectors = []
    for chunk, embedding in zip(chunks, embeddings):
        vectors.append(
            {"id": chunk["id"], "values": embedding, "metadata": chunk["metadata"]}
        )
    return vectors

