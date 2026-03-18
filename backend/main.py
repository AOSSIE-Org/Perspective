"""
main.py
-------
Entry point for the Perspective API backend.

This module initializes the FastAPI application, configures middleware, 
and includes API routes for handling article-related operations.

Key Features:
    - Serves as the main entry point for the Perspective backend.
    - Configures CORS middleware to allow cross-origin requests.
    - Includes article processing routes via FastAPI's router.
    - Can be run directly using uvicorn.

Usage:
    $ uv run main.py

Attributes:
    app (FastAPI): The FastAPI application instance.
"""

from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging
import uuid

app = FastAPI()

logger = logging.getLogger(__name__)

# Handle HTTPExceptions (400, 404, etc.)
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "code": f"HTTP_{exc.status_code}"
        }
    )

# Handle ALL unhandled exceptions (500s)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    trace_id = str(uuid.uuid4())  # Unique ID for debugging
    logger.error(f"[{trace_id}] Unhandled exception: {exc}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "An internal server error occurred",
            "code": "INTERNAL_SERVER_ERROR",
            "trace_id": trace_id  # Return to frontend for easier debugging
        }
    )

from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = exc.errors()
    return JSONResponse(
        status_code=400,
        content={
            "error": errors[0]['msg'] if errors else "Invalid input",
            "code": "VALIDATION_ERROR",
            "details": errors
        }
    )
