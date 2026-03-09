"""
fact_check.py
-------------
LangGraph node that runs fact-checking on the cleaned article text.

Key fix: fact-checking failure is now NON-FATAL.
Previously any error (rate limit, parse failure, no claims found) would
kill the entire pipeline. Now it logs the error and passes an empty facts
list so the pipeline continues to perspective generation.
"""

from app.utils.fact_check_utils import run_fact_check_pipeline
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def run_fact_check(state: dict) -> dict:
    text = state.get("cleaned_text", "")

    if not text:
        logger.warning("Fact-check: empty text — skipping, continuing pipeline")
        return {**state, "facts": [], "status": "success"}

    try:
        verifications, error_message = run_fact_check_pipeline(state)

        if error_message:
            logger.warning(f"Fact-check warning (non-fatal): {error_message}")
            # Return empty facts — pipeline continues
            return {**state, "facts": [], "status": "success"}

        logger.info(f"Fact-check complete: {len(verifications)} claims verified")
        return {**state, "facts": verifications, "status": "success"}

    except Exception as e:
        # Never crash the full pipeline for a fact-check failure
        logger.error(f"Fact-check unexpected error (non-fatal): {e}")
        return {**state, "facts": [], "status": "success"}
