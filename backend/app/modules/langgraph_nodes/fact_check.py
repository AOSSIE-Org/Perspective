"""
fact_check.py
-------------
Provides functionality to run a fact-checking process on given article text.

This module:
    - Validates the presence of `cleaned_text` in the provided state.
    - Runs the fact-checking pipeline using `run_fact_check_pipeline`.
    - Handles errors gracefully and returns structured error responses.

Functions:
    run_fact_check(state: dict) -> dict:
        Executes the fact-checking process and returns either the verification results
        or an error message.
"""


from app.utils.fact_check_utils import run_fact_check_pipeline
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)



def run_fact_check(state):
    try:
        text = state.get("cleaned_text")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        verifications, error_message = run_fact_check_pipeline(state)

        if error_message:
            logger.error(f"Error in fact-checking: {error_message}")
            return {
                "status": "error",
                "error_from": "fact_checking",
                "message": f"{error_message}",
            }

    except Exception as e:
        logger.exception(f"Unexpected error in fact-checking: {e}")
        return {
            "status": "error",
            "error_from": "fact_checking",
            "message": f"{e}",
        }
    return {**state, "facts": verifications, "status": "success"}
