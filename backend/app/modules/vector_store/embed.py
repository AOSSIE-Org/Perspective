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
