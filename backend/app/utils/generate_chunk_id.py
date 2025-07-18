import hashlib


def generate_id(text: str) -> str:
    if not text or not isinstance(text, str):
        raise ValueError("Text must be non-empty string")
    hashed_text = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return f"article-{hashed_text[:15]}"
