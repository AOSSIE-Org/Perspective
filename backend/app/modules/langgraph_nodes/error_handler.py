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


def error_handler(input):
    print("Error detected!")
    print(f"From: {input.get('error_from')}")
    print(f"Message: {input.get('message')}")

    return {
        "status": "stopped_due_to_error",
        "from": [input.get("error_from")],
        "error": [input.get("message")],
    }
