"""
chunk_rag_data.py
-----------------
Converts processed article data into structured chunks for vector storage.

Updated to handle perspective as a plain dict (instead of a Pydantic object),
matching the new generate_perspective.py output format.
Also made fact field validation tolerant — missing fields get defaults
rather than hard-crashing.
"""

from app.utils.generate_chunk_id import generate_id
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def _extract_perspective(obj) -> tuple[str, str, list[str]]:
    """
    Safely extract (perspective_text, reasoning, themes) from the perspective
    object, which can be a dict or a legacy Pydantic model.
    """
    if isinstance(obj, dict):
        return (
            obj.get("perspective", ""),
            obj.get("reasoning", ""),
            obj.get("themes", []),
        )
    # Legacy Pydantic object fallback
    if hasattr(obj, "perspective"):
        return (
            getattr(obj, "perspective", ""),
            getattr(obj, "reasoning", ""),
            getattr(obj, "themes", []),
        )
    return str(obj), "", []


def chunk_rag_data(data: dict) -> list[dict]:
    """
    Transform pipeline state into a flat list of searchable chunks:
      - One counter-perspective chunk (text + reasoning metadata)
      - One chunk per verified fact (claim + verdict metadata)
    """
    # Soft validation — missing facts is acceptable
    if "cleaned_text" not in data:
        raise KeyError("cleaned_text missing from pipeline state")
    if "perspective" not in data:
        raise KeyError("perspective missing from pipeline state")

    article_id = generate_id(data["cleaned_text"])
    chunks: list[dict] = []

    # Perspective chunk
    persp_text, reasoning, themes = _extract_perspective(data["perspective"])
    if persp_text:
        chunks.append(
            {
                "id": f"{article_id}-perspective",
                "text": persp_text,
                "metadata": {
                    "type": "counter-perspective",
                    "reasoning": reasoning,
                    "themes": themes,
                    "article_id": article_id,
                },
            }
        )

    # Fact chunks
    facts = data.get("facts") or []
    if not isinstance(facts, list):
        facts = []

    for i, fact in enumerate(facts):
        if not isinstance(fact, dict):
            continue
        chunks.append(
            {
                "id": f"{article_id}-fact-{i}",
                "text": fact.get("original_claim", ""),
                "metadata": {
                    "type": "fact",
                    "verdict": fact.get("verdict", "Unverifiable"),
                    "confidence": fact.get("confidence", "Low"),
                    "explanation": fact.get("explanation", ""),
                    "source_link": fact.get("source_link", ""),
                    "article_id": article_id,
                },
            }
        )

    logger.info(f"Chunked into {len(chunks)} vectors for article {article_id[:8]}")
    return chunks
