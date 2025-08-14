"""
generate_chunk_id.py
--------------------
Utility for generating consistent, unique identifiers for article content chunks
based on their textual content.

Functions:
    generate_id(text: str) -> str
        - Accepts a non-empty string of text.
        - Uses SHA-256 hashing to produce a deterministic hash value.
        - Returns an identifier string in the format:
              "article-{first_15_characters_of_hash}"
        - Ensures the same input text always results in the same ID, 
          useful for deduplication or versioning in storage systems.

Raises:
    ValueError:
        If the provided text is empty or not a string.

Example:
    generate_id("Breaking news: AI takes over the world!")
    'article-3f9a2b1c5de74a1'
"""


import hashlib


def generate_id(text: str) -> str:
    if not text or not isinstance(text, str):
        raise ValueError("Text must be non-empty string")
    hashed_text = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"article-{hashed_text[:15]}"
