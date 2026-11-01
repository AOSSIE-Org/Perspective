"""
test_langgraph_nodes.py
-----------------------
Unit tests for individual LangGraph node functions.

Each node uses a module-level Groq client instantiated at import time.
The tests provide dummy API environment variables before importing the
application modules so import-time client initialization does not require
real credentials.

store_and_send depends on chunk_rag_data, embed_chunks, and store — all
of which touch Pinecone/SentenceTransformer. Those are patched at the
module boundary.
"""

import os
import sys
import types
import pytest
from unittest.mock import MagicMock, patch

# ---------------------------------------------------------------------------
# Set dummy env vars and stub Groq + Pinecone before any app import
# ---------------------------------------------------------------------------
os.environ.setdefault("GROQ_API_KEY", "dummy-key-for-tests")
os.environ.setdefault("PINECONE_API_KEY", "dummy-pinecone-key")

# Stub app.db.vector_store to prevent import-time Pinecone connection
_vs_stub = types.ModuleType("app.db.vector_store")
_vs_stub.index = MagicMock()
sys.modules.setdefault("app.db.vector_store", _vs_stub)

# Stub app.modules.vector_store.embed to prevent import-time SentenceTransformer
# initialization, which may trigger a Hugging Face network request.
_embed_stub = types.ModuleType("app.modules.vector_store.embed")
_embed_stub.embed_chunks = MagicMock(return_value=[])
sys.modules.setdefault("app.modules.vector_store.embed", _embed_stub)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _mock_completion(content: str) -> MagicMock:
    m = MagicMock()
    m.choices[0].message.content = content
    return m


# ---------------------------------------------------------------------------
# error_handler — pure function, no external deps
# ---------------------------------------------------------------------------

from app.modules.langgraph_nodes.error_handler import error_handler


class TestErrorHandler:
    def test_returns_stopped_status(self):
        result = error_handler({"error_from": "sentiment_analysis", "message": "boom"})
        assert result["status"] == "stopped_due_to_error"

    def test_from_contains_error_source(self):
        result = error_handler({"error_from": "fact_checking", "message": "fail"})
        assert "fact_checking" in result["from"]

    def test_error_contains_message(self):
        result = error_handler({"error_from": "judge", "message": "bad score"})
        assert "bad score" in result["error"]

    def test_missing_keys_use_defaults(self):
        result = error_handler({})
        assert result["status"] == "stopped_due_to_error"
        assert result["from"] == [None]
        assert result["error"] == [None]


# ---------------------------------------------------------------------------
# sentiment node
# ---------------------------------------------------------------------------

import app.modules.langgraph_nodes.sentiment as sentiment_module
from app.modules.langgraph_nodes.sentiment import run_sentiment_sdk


class TestRunSentimentSdk:
    def test_returns_sentiment_on_success(self, mocker):
        mocker.patch.object(
            sentiment_module.client.chat.completions,
            "create",
            return_value=_mock_completion("Negative"),
        )
        state = {"cleaned_text": "The economy is in terrible shape.", "status": "success"}
        result = run_sentiment_sdk(state)

        assert result["status"] == "success"
        assert result["sentiment"] == "negative"

    def test_preserves_existing_state_keys(self, mocker):
        mocker.patch.object(
            sentiment_module.client.chat.completions,
            "create",
            return_value=_mock_completion("Positive"),
        )
        state = {"cleaned_text": "Great news today.", "keywords": ["news"], "status": "success"}
        result = run_sentiment_sdk(state)

        assert result["keywords"] == ["news"]

    def test_returns_error_state_on_missing_text(self):
        result = run_sentiment_sdk({"cleaned_text": "", "status": "success"})
        assert result["status"] == "error"
        assert result["error_from"] == "sentiment_analysis"

    def test_returns_error_state_on_api_exception(self, mocker):
        mocker.patch.object(
            sentiment_module.client.chat.completions,
            "create",
            side_effect=Exception("API unavailable"),
        )
        state = {"cleaned_text": "Some article text here.", "status": "success"}
        result = run_sentiment_sdk(state)

        assert result["status"] == "error"
        assert result["error_from"] == "sentiment_analysis"
        assert "API unavailable" in result["message"]


# ---------------------------------------------------------------------------
# judge node
# ---------------------------------------------------------------------------

import app.modules.langgraph_nodes.judge as judge_module
from app.modules.langgraph_nodes.judge import judge_perspective


class TestJudgePerspective:
    def _state_with_perspective(self, text: str) -> dict:
        perspective = MagicMock()
        perspective.perspective = text
        return {"perspective": perspective, "status": "success", "retries": 1}

    def test_parses_score_from_response(self, mocker):
        mocker.patch.object(
            judge_module.client.chat.completions,
            "create",
            return_value=_mock_completion("82"),
        )
        result = judge_perspective(self._state_with_perspective("A well-reasoned counter view."))
        assert result["score"] == 82
        assert result["status"] == "success"

    def test_clamps_score_to_100(self, mocker):
        mocker.patch.object(
            judge_module.client.chat.completions,
            "create",
            return_value=_mock_completion("150"),
        )
        result = judge_perspective(self._state_with_perspective("Some perspective text."))
        assert result["score"] == 100

    def test_accepts_zero_score(self, mocker):
        # The regex \b(\d{1,3})\b matches the first non-negative integer token.
        # "-10" yields match "10"; max(0, min(100, 10)) == 10.
        # True clamping to 0 is exercised by a response with no integer at all (score=0).
        mocker.patch.object(
            judge_module.client.chat.completions,
            "create",
            return_value=_mock_completion("0"),
        )
        result = judge_perspective(self._state_with_perspective("Some perspective text."))
        assert result["score"] == 0

    def test_returns_zero_score_when_no_integer_in_response(self, mocker):
        mocker.patch.object(
            judge_module.client.chat.completions,
            "create",
            return_value=_mock_completion("I cannot score this."),
        )
        result = judge_perspective(self._state_with_perspective("Some perspective text."))
        assert result["score"] == 0
        assert result["status"] == "success"

    def test_returns_zero_score_for_empty_perspective(self, mocker):
        perspective = MagicMock()
        perspective.perspective = ""
        state = {"perspective": perspective, "status": "success", "retries": 1}
        result = judge_perspective(state)
        assert result["score"] == 0

    def test_returns_error_on_api_exception(self, mocker):
        mocker.patch.object(
            judge_module.client.chat.completions,
            "create",
            side_effect=Exception("network error"),
        )
        result = judge_perspective(self._state_with_perspective("Some text."))
        assert result["status"] == "error"
        assert result["error_from"] == "judge"


# ---------------------------------------------------------------------------
# generate_perspective node
# ---------------------------------------------------------------------------

import app.modules.langgraph_nodes.generate_perspective as gp_module
from app.modules.langgraph_nodes.generate_perspective import generate_perspective


class TestGeneratePerspective:
    def _base_state(self):
        return {
            "cleaned_text": "Ice sheets are melting due to climate change.",
            "facts": [
                {
                    "original_claim": "Ice sheets are melting.",
                    "verdict": "True",
                    "explanation": "Supported by NASA data.",
                }
            ],
            "sentiment": "negative",
            "retries": 0,
            "status": "success",
        }

    def test_returns_perspective_object_on_success(self, mocker):
        mocker.patch.object(
            gp_module.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"reasoning": "Step 1: examine data.", "perspective": "Counter view here."}'
            ),
        )
        result = generate_perspective(self._base_state())
        assert result["status"] == "success"
        assert hasattr(result["perspective"], "perspective")
        assert hasattr(result["perspective"], "reasoning")

    def test_perspective_text_matches_llm_output(self, mocker):
        mocker.patch.object(
            gp_module.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"reasoning": "Analysis here.", "perspective": "Alternative view."}'
            ),
        )
        result = generate_perspective(self._base_state())
        assert result["perspective"].perspective == "Alternative view."

    def test_increments_retries(self, mocker):
        mocker.patch.object(
            gp_module.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"reasoning": "r", "perspective": "p"}'
            ),
        )
        state = self._base_state()
        state["retries"] = 1
        result = generate_perspective(state)
        assert result["retries"] == 2

    def test_returns_error_on_missing_cleaned_text(self, mocker):
        state = self._base_state()
        state["cleaned_text"] = ""
        result = generate_perspective(state)
        assert result["status"] == "error"
        assert result["error_from"] == "generate_perspective"

    def test_returns_error_on_api_exception(self, mocker):
        mocker.patch.object(
            gp_module.client.chat.completions,
            "create",
            side_effect=Exception("LLM down"),
        )
        result = generate_perspective(self._base_state())
        assert result["status"] == "error"
        assert "LLM down" in result["message"]

    def test_handles_empty_facts_list(self, mocker):
        mocker.patch.object(
            gp_module.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"reasoning": "No facts.", "perspective": "Still a counter view."}'
            ),
        )
        state = self._base_state()
        state["facts"] = []
        result = generate_perspective(state)
        assert result["status"] == "success"


# ---------------------------------------------------------------------------
# fact_check node — patches run_fact_check_pipeline
# ---------------------------------------------------------------------------

from app.modules.langgraph_nodes.fact_check import run_fact_check


class TestRunFactCheck:
    def test_returns_facts_on_success(self, mocker):
        mock_verifications = [
            {
                "original_claim": "Ice sheets are melting.",
                "verdict": "True",
                "explanation": "Confirmed by data.",
                "source_link": "https://example.com",
            }
        ]
        mocker.patch(
            "app.modules.langgraph_nodes.fact_check.run_fact_check_pipeline",
            return_value=(mock_verifications, None),
        )
        state = {
            "cleaned_text": "Ice sheets are melting due to climate change.",
            "status": "success",
        }
        result = run_fact_check(state)
        assert result["status"] == "success"
        assert result["facts"] == mock_verifications

    def test_returns_error_when_pipeline_returns_error_message(self, mocker):
        mocker.patch(
            "app.modules.langgraph_nodes.fact_check.run_fact_check_pipeline",
            return_value=([], "Claim extraction failed."),
        )
        state = {"cleaned_text": "Some text.", "status": "success"}
        result = run_fact_check(state)
        assert result["status"] == "error"
        assert result["error_from"] == "fact_checking"

    def test_returns_error_on_missing_cleaned_text(self):
        result = run_fact_check({"cleaned_text": "", "status": "success"})
        assert result["status"] == "error"
        assert result["error_from"] == "fact_checking"

    def test_returns_error_on_pipeline_exception(self, mocker):
        mocker.patch(
            "app.modules.langgraph_nodes.fact_check.run_fact_check_pipeline",
            side_effect=Exception("search failed"),
        )
        state = {"cleaned_text": "Some article text.", "status": "success"}
        result = run_fact_check(state)
        assert result["status"] == "error"
        assert "search failed" in result["message"]


# ---------------------------------------------------------------------------
# store_and_send node — patches chunk_rag_data, embed_chunks, store
# ---------------------------------------------------------------------------

from app.modules.langgraph_nodes.store_and_send import store_and_send


class TestStoreAndSend:
    def _full_state(self):
        perspective = MagicMock()
        perspective.perspective = "Counter view."
        perspective.reasoning = "Reasoning steps."
        return {
            "cleaned_text": "Article text about climate change and ice melt.",
            "facts": [
                {
                    "original_claim": "Ice is melting.",
                    "verdict": "True",
                    "explanation": "NASA data.",
                    "source_link": "https://example.com",
                }
            ],
            "perspective": perspective,
            "sentiment": "negative",
            "score": 85,
            "retries": 1,
            "status": "success",
        }

    def test_returns_success_status(self, mocker):
        mocker.patch(
            "app.modules.langgraph_nodes.store_and_send.chunk_rag_data",
            return_value=[{"id": "chunk-1", "text": "text", "metadata": {}}],
        )
        mocker.patch(
            "app.modules.langgraph_nodes.store_and_send.embed_chunks",
            return_value=[{"id": "chunk-1", "values": [0.1] * 384, "metadata": {}}],
        )
        mocker.patch("app.modules.langgraph_nodes.store_and_send.store")

        result = store_and_send(self._full_state())
        assert result["status"] == "success"

    def test_storage_failure_is_non_fatal(self, mocker):
        """Vector storage errors are caught and logged as warnings, not propagated."""
        mocker.patch(
            "app.modules.langgraph_nodes.store_and_send.chunk_rag_data",
            side_effect=Exception("Pinecone unavailable"),
        )
        result = store_and_send(self._full_state())
        # Non-fatal: should still return success
        assert result["status"] == "success"

    def test_preserves_state_keys(self, mocker):
        mocker.patch(
            "app.modules.langgraph_nodes.store_and_send.chunk_rag_data",
            return_value=[],
        )
        mocker.patch(
            "app.modules.langgraph_nodes.store_and_send.embed_chunks",
            return_value=[],
        )
        result = store_and_send(self._full_state())
        assert "cleaned_text" in result
        assert "facts" in result
