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

from fastapi import FastAPI
from app.routes.routes import router as article_router
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Perspective API",
    version="1.0.0",
    description=("An API to generate alternative perspectives on biased articles"),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(article_router, prefix="/api", tags=["Articles"])

if __name__ == "__main__":
    import uvicorn
    import os

    port = int(os.environ.get("PORT", 7860))
    print(f"Server is running on http://0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)
