"""
test_routes.py
--------------
Integration tests for FastAPI routes.

app.db.vector_store raises ValueError at import time if PINECONE_API_KEY
is missing. app.modules.chat.get_rag_data also instantiates Pinecone at
module level. Both are stubbed in sys.modules before the app is imported.

Groq raises at import time if GROQ_API_KEY is absent, so we set a dummy
env var before importing any app module.
"""

import os
import sys
import types
import pytest
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Set dummy env vars and stub Pinecone-dependent modules before any app import
# ---------------------------------------------------------------------------
os.environ.setdefault("GROQ_API_KEY", "dummy-key-for-tests")
os.environ.setdefault("PINECONE_API_KEY", "dummy-pinecone-key")


# ---------------------------------------------------------------------------
# Stub Pinecone-dependent modules before any app import
# ---------------------------------------------------------------------------

def _stub_pinecone_modules():
    """Insert lightweight stubs so import-time Pinecone and SentenceTransformer calls never execute."""
    # Stub app.db.vector_store
    vs_stub = types.ModuleType("app.db.vector_store")
    vs_stub.index = MagicMock()
    sys.modules.setdefault("app.db.vector_store", vs_stub)

    # Stub app.modules.chat.get_rag_data
    rag_stub = types.ModuleType("app.modules.chat.get_rag_data")
    rag_stub.search_pinecone = MagicMock(return_value=[])
    sys.modules.setdefault("app.modules.chat.get_rag_data", rag_stub)

    # Stub app.modules.vector_store.embed to prevent import-time SentenceTransformer
    # initialization, which may trigger a Hugging Face network request.
    embed_stub = types.ModuleType("app.modules.vector_store.embed")
    embed_stub.embed_chunks = MagicMock(return_value=[])
    sys.modules.setdefault("app.modules.vector_store.embed", embed_stub)


_stub_pinecone_modules()

# Now safe to import the app
from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)


# ---------------------------------------------------------------------------
# GET /api/ — health check
# ---------------------------------------------------------------------------

class TestHealthCheck:
    def test_returns_200(self):
        response = client.get("/api/")
        assert response.status_code == 200

    def test_returns_live_message(self):
        response = client.get("/api/")
        assert response.json() == {"message": "Perspective API is live!"}


# ---------------------------------------------------------------------------
# POST /api/bias
# ---------------------------------------------------------------------------

class TestBiasEndpoint:
    def test_returns_bias_score_on_valid_url(self, mocker):
        mocker.patch(
            "app.routes.routes.run_scraper_pipeline",
            return_value={"cleaned_text": "Article about climate change.", "keywords": []},
        )
        mocker.patch(
            "app.routes.routes.check_bias",
            return_value={"bias_score": 42, "status": "success"},
        )
        response = client.post("/api/bias", json={"url": "https://example.com/article"})
        assert response.status_code == 200
        data = response.json()
        assert data["bias_score"] == 42
        assert data["status"] == "success"

    def test_rejects_missing_url_field(self):
        response = client.post("/api/bias", json={})
        assert response.status_code == 422

    def test_rejects_non_json_body(self):
        response = client.post("/api/bias", content="not json", headers={"Content-Type": "text/plain"})
        assert response.status_code in (422, 400)


# ---------------------------------------------------------------------------
# POST /api/process
# ---------------------------------------------------------------------------

class TestProcessEndpoint:
    def _mock_workflow_result(self):
        perspective = MagicMock()
        perspective.perspective = "Counter view on climate."
        perspective.reasoning = "Step 1: examine data."
        return {
            "cleaned_text": "Article text.",
            "sentiment": "negative",
            "facts": [],
            "perspective": perspective,
            "score": 80,
            "retries": 1,
            "status": "success",
        }

    def test_returns_200_on_valid_request(self, mocker):
        mocker.patch(
            "app.routes.routes.run_scraper_pipeline",
            return_value={"cleaned_text": "Article text.", "keywords": []},
        )
        mocker.patch(
            "app.routes.routes.run_langgraph_workflow",
            return_value=self._mock_workflow_result(),
        )
        response = client.post("/api/process", json={"url": "https://example.com/article"})
        assert response.status_code == 200

    def test_rejects_missing_url(self):
        response = client.post("/api/process", json={})
        assert response.status_code == 422


# ---------------------------------------------------------------------------
# POST /api/chat
# ---------------------------------------------------------------------------

class TestChatEndpoint:
    def test_returns_answer_on_valid_message(self, mocker):
        mocker.patch(
            "app.routes.routes.search_pinecone",
            return_value=[{"id": "1", "score": 0.9, "metadata": {"explanation": "Ice melts."}}],
        )
        mocker.patch(
            "app.routes.routes.ask_llm",
            return_value="Ice melts because of rising temperatures.",
        )
        response = client.post("/api/chat", json={"message": "Why is ice melting?"})
        assert response.status_code == 200
        assert "answer" in response.json()
        assert response.json()["answer"] == "Ice melts because of rising temperatures."

    def test_rejects_missing_message_field(self):
        response = client.post("/api/chat", json={})
        assert response.status_code == 422
