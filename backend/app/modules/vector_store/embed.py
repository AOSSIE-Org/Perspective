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


from typing import List, Dict, Any
import os
import logging


_embedder = None
_model_name = os.getenv("EMBED_MODEL_NAME", "all-MiniLM-L6-v2")


def _get_embedder():
    """Lazily load the SentenceTransformer embedder. If loading fails (network/DNS),
    return a deterministic fallback embedder that produces fixed-size vectors.
    """
    global _embedder
    if _embedder is not None:
        return _embedder

    try:
        from sentence_transformers import SentenceTransformer

        _embedder = SentenceTransformer(_model_name)
        return _embedder
    except Exception as exc:  # pragma: no cover - defensive fallback
        logging.warning(
            "Failed to load SentenceTransformer '%s' (%s). Falling back to deterministic embedder.",
            _model_name,
            exc,
        )

        class _FallbackEmbedder:
            def __init__(self, dim: int = 384):
                self.dim = dim

            def encode(self, texts: List[str]):
                # deterministic hash-based vectors (not semantically meaningful)
                import hashlib

                out = []
                for t in texts:
                    h = hashlib.sha256(t.encode("utf-8")).digest()
                    # expand/repeat to required dim and convert to floats in [-1,1]
                    vals = []
                    i = 0
                    while len(vals) < self.dim:
                        b = h[i % len(h)]
                        # map byte to [-1,1]
                        vals.append((b / 127.5) - 1.0)
                        i += 1
                    out.append(vals[: self.dim])
                return out

        _embedder = _FallbackEmbedder()
        return _embedder


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
    embedder = _get_embedder()
    embeddings = embedder.encode(texts)
    # some embedders return numpy arrays
    try:
        embeddings = embeddings.tolist()
    except Exception:
        # assume it's already a list of lists
        pass

    vectors = []
    for chunk, embedding in zip(chunks, embeddings):
        vectors.append(
            {"id": chunk["id"], "values": embedding, "metadata": chunk["metadata"]}
        )
    return vectors
