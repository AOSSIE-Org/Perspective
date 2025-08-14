"""
error_handler.py
----------------
Provides a simple utility for handling and logging error information.

This module:
    - Prints error details (source and message) to the console.
    - Returns a standardized error dictionary for downstream processing.

Functions:
    error_handler(input: dict) -> dict:
        Logs error details and returns a structured error response.
"""


from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def error_handler(input):
    error_from = input.get("error_from", "Unknown source")
    message = input.get("message", "No message provided")
    logger.error(f"Error detected from '{error_from}': {message}")

    return {
        "status": "stopped_due_to_error",
        "from": [input.get("error_from")],
        "error": [input.get("message")],
    }
