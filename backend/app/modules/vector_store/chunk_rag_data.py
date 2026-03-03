"""
chunk_rag_data.py
-----------------
Converts the LangGraph analysis state into embeddable chunks
for Pinecone vector storage.
"""

from typing import Any
from app.utils.generate_chunk_id import generate_id
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def chunk_rag_data(state: dict) -> tuple[list[dict[str, Any]], str | None]:
    """Return ``(chunks, error_message | None)``.

    Each chunk is a dict with keys ``id``, ``text``, and ``metadata``.
    """
    try:
        chunks: list[dict[str, Any]] = []

        # --- Perspective chunk -------------------------------------------
        perspective_obj = state.get("perspective")
        if perspective_obj:
            if hasattr(perspective_obj, "perspective"):
                p_text = perspective_obj.perspective
            elif isinstance(perspective_obj, dict):
                p_text = perspective_obj.get("perspective", "")
            else:
                p_text = str(perspective_obj)

            if p_text:
                chunks.append(
                    {
                        "id": generate_id(f"perspective-{p_text[:60]}"),
                        "text": p_text,
                        "metadata": {
                            "type": "perspective",
                            "sentiment": state.get("sentiment", ""),
                            "score": state.get("score", 0),
                        },
                    }
                )

        # --- Summary chunk -----------------------------------------------
        summary = state.get("article_summary", "")
        if summary:
            chunks.append(
                {
                    "id": generate_id(f"summary-{summary[:60]}"),
                    "text": summary,
                    "metadata": {
                        "type": "summary",
                        "sentiment": state.get("sentiment", ""),
                    },
                }
            )

        # --- Fact chunks -------------------------------------------------
        for idx, fact in enumerate(state.get("facts", [])):
            claim = fact.get("claim", "")
            reason = fact.get("reason", "")
            status = fact.get("status", "Unknown")
            if claim:
                fact_text = (
                    f"Claim: {claim}. "
                    f"Verdict: {status}. "
                    f"Reason: {reason}"
                )
                chunks.append(
                    {
                        "id": generate_id(f"fact-{idx}-{claim[:40]}"),
                        "text": fact_text,
                        "metadata": {
                            "type": "fact",
                            "claim": claim,
                            "status": status,
                            "reasoning": reason,
                        },
                    }
                )

        logger.info(f"Created {len(chunks)} chunks for vector storage.")
        return chunks, None

    except Exception as e:
        logger.exception(f"Error chunking data: {e}")
        return [], str(e)