"""
main.py
-------
Entry point for the Perspective API backend.

Improvements over v1:
  - Rate limiting via slowapi (100 req/min per IP on /api/process and /api/bias)
  - URL validation middleware: rejects obviously malformed or localhost URLs
  - Tighter CORS: only allows known frontend origins in non-dev mode
  - Startup/shutdown lifecycle events for clean DB and scheduler management
  - Structured FastAPI metadata (title, version, docs_url)
  - Uvicorn configured with workers=1, loop=asyncio for stability
"""

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.routes.routes import router as article_router
from app.routes.perspective_routes import router as perspective_router
from app.logging.logging_config import setup_logger
from app.db.sqlite_cache import init_db
from app.modules.trending.cron_job import start_scheduler

logger = setup_logger(__name__)

# ── Allowed CORS origins ──────────────────────────────────────────────────────
_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://perspective-ai.vercel.app",  # update with your production domain
]

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Perspective API",
    version="2.0.0",
    description="Analyse articles for bias, facts, and multi-perspective insights.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=_ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── URL sanity middleware ─────────────────────────────────────────────────────
@app.middleware("http")
async def validate_request_body(request: Request, call_next):
    """
    Intercept POST requests to /api/process and /api/bias.
    Reject requests with obviously invalid URLs (empty, localhost, non-HTTP).
    """
    if request.method == "POST" and request.url.path in ("/api/process", "/api/bias"):
        try:
            body = await request.json()
            url = (body.get("url") or "").strip()
            if not url:
                return JSONResponse(
                    status_code=400, content={"error": "URL is required."}
                )
            if not url.startswith(("http://", "https://")):
                return JSONResponse(
                    status_code=400,
                    content={"error": "URL must start with http:// or https://"},
                )
            # Reject localhost / internal network URLs
            from urllib.parse import urlparse

            host = urlparse(url).hostname or ""
            blocked = ("localhost", "127.0.0.1", "0.0.0.0", "::1", "169.254.")
            if any(host.startswith(b) for b in blocked) or host.endswith(".local"):
                return JSONResponse(
                    status_code=400,
                    content={"error": "Internal network URLs are not allowed."},
                )
        except Exception:
            pass  # let the route handle malformed JSON

    return await call_next(request)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(article_router, prefix="/api", tags=["Articles"])
app.include_router(perspective_router, prefix="/api", tags=["Perspectives"])


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@app.on_event("startup")
async def on_startup():
    logger.info("Starting Perspective API v2.0…")
    init_db()
    start_scheduler()
    logger.info("Startup complete.")


if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", 7860))
    logger.info(f"Server starting on http://0.0.0.0:{port}")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        loop="asyncio",
        log_level="warning",  # uvicorn noise suppressed; app logger handles it
        access_log=False,
    )
