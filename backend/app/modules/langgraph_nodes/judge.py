"""
judge.py
--------
Evaluates the quality of the generated perspective.

Optimised: since generate_perspective.py now self-assigns a quality score
based on whether the output was valid structured JSON, this node simply
reads that score from state — no extra LLM call needed.

Score is still used by the LangGraph router: < 70 → retry, >= 70 → store.
"""

from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def judge_perspective(state: dict) -> dict:
    try:
        perspective_obj = state.get("perspective")

        # Retrieve pre-assigned score from generate_perspective
        score = state.get("score", 0)

        # If perspective is a dict (structured), use embedded score
        if isinstance(perspective_obj, dict):
            score = perspective_obj.get("score", score)
            text_preview = str(perspective_obj.get("perspective", ""))[:80]
        else:
            text_preview = str(perspective_obj)[:80] if perspective_obj else ""

        if not text_preview.strip():
            raise ValueError("Empty perspective — cannot score")

        logger.info(f"Perspective scored: {score} | preview: '{text_preview}'")
        return {**state, "score": score, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in judge_perspective: {e}")
        return {"status": "error", "error_from": "judge_perspective", "message": str(e)}
