"""
test_llm_processing.py
----------------------
Unit tests for:
  - app.modules.facts_check.llm_processing (claim extractor + fact verifier)
  - app.modules.chat.llm_processing (build_context + ask_llm)

All Groq API calls are mocked. Tests verify that the application code
correctly handles LLM responses, parses JSON, and handles errors.
"""

import os
import sys
import types
import pytest
from unittest.mock import MagicMock

# ---------------------------------------------------------------------------
# Set dummy env vars before any app import
# ---------------------------------------------------------------------------
os.environ.setdefault("GROQ_API_KEY", "dummy-key-for-tests")
os.environ.setdefault("PINECONE_API_KEY", "dummy-pinecone-key")

# Stub app.db.vector_store to prevent import-time Pinecone connection
_vs_stub = types.ModuleType("app.db.vector_store")
_vs_stub.index = MagicMock()
sys.modules.setdefault("app.db.vector_store", _vs_stub)


def _mock_completion(content: str) -> MagicMock:
    m = MagicMock()
    m.choices[0].message.content = content
    return m


# ---------------------------------------------------------------------------
# facts_check/llm_processing
# ---------------------------------------------------------------------------

import app.modules.facts_check.llm_processing as fc_llm
from app.modules.facts_check.llm_processing import (
    run_claim_extractor_sdk,
    run_fact_verifier_sdk,
)


class TestRunClaimExtractorSdk:
    def _state(self, text="Ice sheets are melting due to climate change."):
        return {"cleaned_text": text, "status": "success"}

    def test_returns_verifiable_claims_on_success(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion(
                "1. Ice sheets are melting.\n2. Emissions are rising.\n3. Sea levels are up."
            ),
        )
        result = run_claim_extractor_sdk(self._state())
        assert result["status"] == "success"
        assert "verifiable_claims" in result
        assert "Ice sheets" in result["verifiable_claims"]

    def test_preserves_existing_state_keys(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion("1. Some claim."),
        )
        state = self._state()
        state["keywords"] = ["climate"]
        result = run_claim_extractor_sdk(state)
        assert result["keywords"] == ["climate"]

    def test_returns_error_on_empty_text(self):
        result = run_claim_extractor_sdk({"cleaned_text": "", "status": "success"})
        assert result["status"] == "error"
        assert result["error_from"] == "claim_extraction"

    def test_returns_error_on_api_exception(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            side_effect=Exception("Groq timeout"),
        )
        result = run_claim_extractor_sdk(self._state())
        assert result["status"] == "error"
        assert "Groq timeout" in result["message"]


class TestRunFactVerifierSdk:
    def _search_results(self):
        return [
            {
                "claim": "Ice sheets are melting at unprecedented rate.",
                "title": "NASA Study Confirms Ice Melt",
                "snippet": "NASA data shows accelerating ice loss.",
                "link": "https://nasa.gov/study",
            }
        ]

    def test_returns_verifications_list_on_success(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"verdict": "True", "explanation": "Supported by NASA.", '
                '"original_claim": "Ice sheets are melting.", "source_link": "https://nasa.gov"}'
            ),
        )
        result = run_fact_verifier_sdk(self._search_results())
        assert result["status"] == "success"
        assert "verifications" in result
        assert len(result["verifications"]) == 1

    def test_verification_has_required_keys(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion(
                '{"verdict": "True", "explanation": "Evidence found.", '
                '"original_claim": "Ice is melting.", "source_link": "https://example.com"}'
            ),
        )
        result = run_fact_verifier_sdk(self._search_results())
        verification = result["verifications"][0]
        for key in ("verdict", "explanation", "original_claim", "source_link"):
            assert key in verification

    def test_handles_malformed_json_gracefully(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion("This is not JSON at all."),
        )
        result = run_fact_verifier_sdk(self._search_results())
        assert result["status"] == "success"
        verification = result["verifications"][0]
        # Falls back to "Unverified" when JSON cannot be parsed
        assert verification["verdict"] == "Unverified"

    def test_strips_markdown_code_fences(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            return_value=_mock_completion(
                "```json\n"
                '{"verdict": "False", "explanation": "Contradicted.", '
                '"original_claim": "claim", "source_link": "https://x.com"}\n'
                "```"
            ),
        )
        result = run_fact_verifier_sdk(self._search_results())
        assert result["verifications"][0]["verdict"] == "False"

    def test_returns_error_on_api_exception(self, mocker):
        mocker.patch.object(
            fc_llm.client.chat.completions,
            "create",
            side_effect=Exception("API error"),
        )
        result = run_fact_verifier_sdk(self._search_results())
        assert result["status"] == "error"
        assert result["error_from"] == "fact_verification"

    @pytest.mark.xfail(
        raises=AssertionError,
        reason="run_fact_verifier_sdk catches its own UnboundLocalError (claim unbound when "
               "search_results=[]) and returns an error dict instead of success with empty "
               "verifications. Fix the function to handle empty input correctly.",
        strict=True,
    )
    def test_empty_search_results_returns_empty_verifications(self):
        result = run_fact_verifier_sdk([])
        assert result["status"] == "success"
        assert result["verifications"] == []


# ---------------------------------------------------------------------------
# chat/llm_processing
# ---------------------------------------------------------------------------

import app.modules.chat.llm_processing as chat_llm
from app.modules.chat.llm_processing import build_context, ask_llm


class TestBuildContext:
    def test_extracts_explanation_from_metadata(self):
        docs = [{"metadata": {"explanation": "Ice is melting fast.", "reasoning": ""}}]
        ctx = build_context(docs)
        assert "Ice is melting fast." in ctx

    def test_falls_back_to_reasoning_when_no_explanation(self):
        docs = [{"metadata": {"explanation": None, "reasoning": "Step 1: check data."}}]
        ctx = build_context(docs)
        assert "Step 1: check data." in ctx

    def test_joins_multiple_docs(self):
        docs = [
            {"metadata": {"explanation": "Fact A.", "reasoning": ""}},
            {"metadata": {"explanation": "Fact B.", "reasoning": ""}},
        ]
        ctx = build_context(docs)
        assert "Fact A." in ctx
        assert "Fact B." in ctx

    def test_empty_docs_returns_empty_string(self):
        assert build_context([]) == ""


class TestAskLlm:
    def test_returns_llm_answer(self, mocker):
        mocker.patch.object(
            chat_llm.client.chat.completions,
            "create",
            return_value=_mock_completion("The ice is melting because of emissions."),
        )
        docs = [{"metadata": {"explanation": "Ice melt data.", "reasoning": ""}}]
        answer = ask_llm("Why is ice melting?", docs)
        assert answer == "The ice is melting because of emissions."

    def test_passes_question_to_llm(self, mocker):
        captured = {}

        def capture_call(**kwargs):
            captured["messages"] = kwargs["messages"]
            return _mock_completion("answer")

        mocker.patch.object(
            chat_llm.client.chat.completions, "create", side_effect=capture_call
        )
        ask_llm("What causes sea level rise?", [{"metadata": {"explanation": "", "reasoning": ""}}])
        user_content = captured["messages"][-1]["content"]
        assert "What causes sea level rise?" in user_content
