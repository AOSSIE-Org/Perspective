import hashlib


def generate_id(text: str) -> str:
    hashed_text = hashlib.sha1(text.encode("utf-8")).hexdigest()
    print(hashed_text)
    return f"article-{hashed_text[:8]}"
