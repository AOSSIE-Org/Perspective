"""Tests for claim search (Google with a DuckDuckGo fallback) and the Groq claim extractor/verifier."""

import pytest

from app.config import (
    CLAIM_EXTRACTOR_MODEL,
    DDG_MAX_RESULTS,
    FACT_VERIFIER_MODEL,
    GOOGLE_SEARCH_ENGINE_ID,
    GOOGLE_SEARCH_TIMEOUT_SECONDS,
    GOOGLE_SEARCH_URL,
    SEARCH_KEY_PLACEHOLDER,
)
from app.modules.facts_check import llm_processing
from app.modules.facts_check import web_search
from app.modules.langgraph_nodes import generate_perspective as perspective_module
from app.utils import fact_check_utils

QUERY = "The bridge cost 40 million dollars"
GOOGLE_ITEM = {"title": "Bridge budget", "link": "https://news.example/budget", "snippet": "It cost 40M.", "kind": "x"}
DDG_ITEM = {"title": "DDG bridge", "href": "https://ddg.example/bridge", "body": "Opened in March."}
DDG_RESULT = [{"title": "DDG bridge", "link": "https://ddg.example/bridge", "snippet": "Opened in March."}]


@pytest.fixture
def search(monkeypatch):
    """Fake both search providers; `config` sets their replies and `calls` records the requests."""
    calls = {"google": [], "ddg": []}
    config = {"google": {"items": [GOOGLE_ITEM]}, "ddg": [DDG_ITEM]}

    class FakeResponse:
        def __init__(self, payload):
            self.payload = payload

        def json(self):
            return self.payload

    def fake_get(url, params, timeout):
        calls["google"].append({"url": url, "params": params, "timeout": timeout})
        if isinstance(config["google"], Exception):
            raise config["google"]
        return FakeResponse(config["google"])

    class FakeDDGS:
        def text(self, query, max_results):
            calls["ddg"].append({"query": query, "max_results": max_results})
            if isinstance(config["ddg"], Exception):
                raise config["ddg"]
            return iter(config["ddg"])

    monkeypatch.setattr(web_search.requests, "get", fake_get)
    monkeypatch.setattr(web_search, "DDGS", FakeDDGS)
    monkeypatch.setattr(web_search, "GOOGLE_SEARCH", "configured-google-key")
    return config, calls


def test_google_is_used_when_a_key_is_configured(search):
    _, calls = search

    assert web_search.search_google(QUERY) == [
        {"title": "Bridge budget", "link": "https://news.example/budget", "snippet": "It cost 40M."}
    ]
    assert calls["google"] == [
        {
            "url": GOOGLE_SEARCH_URL,
            "params": {"key": "configured-google-key", "cx": GOOGLE_SEARCH_ENGINE_ID, "q": QUERY},
            "timeout": GOOGLE_SEARCH_TIMEOUT_SECONDS,
        }
    ]
    assert calls["ddg"] == []


@pytest.mark.parametrize("key", [None, "", SEARCH_KEY_PLACEHOLDER])
def test_duckduckgo_is_used_without_a_real_google_key(monkeypatch, search, key):
    _, calls = search
    monkeypatch.setattr(web_search, "GOOGLE_SEARCH", key)

    assert web_search.search_google(QUERY) == DDG_RESULT
    assert calls["google"] == []
    assert calls["ddg"] == [{"query": QUERY, "max_results": DDG_MAX_RESULTS}]


@pytest.mark.parametrize(
    "google_reply",
    [{"items": []}, {"error": {"code": 403}}, ValueError("invalid JSON")],
    ids=["no-items", "api-error", "bad-response"],
)
def test_duckduckgo_is_used_when_google_finds_nothing_or_fails(search, google_reply):
    config, calls = search
    config["google"] = google_reply

    assert web_search.search_google(QUERY) == DDG_RESULT
    assert len(calls["google"]) == 1
    assert len(calls["ddg"]) == 1


def test_only_the_first_duckduckgo_result_is_returned(search, monkeypatch):
    config, _ = search
    monkeypatch.setattr(web_search, "GOOGLE_SEARCH", None)
    config["ddg"] = [DDG_ITEM, {"title": "Second", "href": "https://ddg.example/2", "body": "Other."}]

    assert web_search.search_google(QUERY) == DDG_RESULT


@pytest.mark.parametrize("ddg_reply", [[], RuntimeError("rate limited")], ids=["no-results", "ddg-fails"])
def test_returns_nothing_when_both_providers_come_up_empty(search, ddg_reply):
    config, _ = search
    config["google"] = {"items": []}
    config["ddg"] = ddg_reply

    assert web_search.search_google(QUERY) == []


# --- claim extractor ---------------------------------------------------------------------


def test_claim_extractor_returns_the_model_output_with_the_state(monkeypatch, fake_chat_client):
    client = fake_chat_client("  1. The bridge cost 40M.\n2. It opened in March.  \n")
    monkeypatch.setattr(llm_processing, "client", client)
    state = {"cleaned_text": "The bridge cost 40M and opened in March.", "sentiment": "neutral"}

    result = llm_processing.run_claim_extractor_sdk(state)

    assert result == {**state, "verifiable_claims": "1. The bridge cost 40M.\n2. It opened in March.", "status": "success"}
    [request] = client.requests
    assert request["model"] == CLAIM_EXTRACTOR_MODEL
    assert state["cleaned_text"] in request["messages"][-1]["content"]


def test_claim_extractor_rejects_missing_text_without_calling_the_llm(monkeypatch, fake_chat_client):
    client = fake_chat_client()
    monkeypatch.setattr(llm_processing, "client", client)

    result = llm_processing.run_claim_extractor_sdk({"cleaned_text": ""})

    assert result == {
        "status": "error",
        "error_from": "claim_extraction",
        "message": "Missing or empty 'cleaned_text' in state",
    }
    assert client.requests == []


def test_claim_extractor_reports_api_failures(monkeypatch, fake_chat_client):
    monkeypatch.setattr(llm_processing, "client", fake_chat_client(ConnectionError("groq unavailable")))

    result = llm_processing.run_claim_extractor_sdk({"cleaned_text": "Some article."})

    assert result == {"status": "error", "error_from": "claim_extraction", "message": "groq unavailable"}


# --- fact verifier -----------------------------------------------------------------------


def test_verifier_checks_each_result_in_order_and_ignores_surrounding_chatter(monkeypatch, fake_chat_client):
    client = fake_chat_client(
        'Sure! Here is the verdict: {"verdict": "True", "explanation": "Matches.", '
        '"original_claim": "A", "source_link": "https://a.example"} Hope this helps.',
        '{"verdict": "False", "explanation": "Contradicted.", "original_claim": "B", "source_link": "https://b.example"}',
    )
    monkeypatch.setattr(llm_processing, "client", client)

    result = llm_processing.run_fact_verifier_sdk(
        [
            {"claim": "A", "title": "Title A", "snippet": "Snippet A", "link": "https://a.example"},
            {"claim": "B", "title": "Title B", "snippet": "Snippet B", "link": "https://b.example"},
        ]
    )

    assert result["status"] == "success"
    assert [(v["original_claim"], v["verdict"]) for v in result["verifications"]] == [("A", "True"), ("B", "False")]
    assert [r["model"] for r in client.requests] == [FACT_VERIFIER_MODEL, FACT_VERIFIER_MODEL]
    first_prompt = client.requests[0]["messages"][-1]["content"]
    assert "Claim: A" in first_prompt
    assert "Title A\nSnippet A\nLink: https://a.example" in first_prompt


def test_verifier_reports_api_failures(monkeypatch, fake_chat_client):
    monkeypatch.setattr(llm_processing, "client", fake_chat_client(TimeoutError("timed out")))

    result = llm_processing.run_fact_verifier_sdk([{"claim": "A", "link": "https://a.example"}])

    assert result == {"status": "error", "error_from": "fact_verification", "message": "timed out"}


# --- fact-check pipeline and perspective edge cases ------------------------------------------


def test_fact_check_pipeline_stops_when_claim_extraction_fails(monkeypatch):
    searched = []
    monkeypatch.setattr(
        fact_check_utils,
        "run_claim_extractor_sdk",
        lambda state: {"status": "error", "error_from": "claim_extraction", "message": "groq unavailable"},
    )
    monkeypatch.setattr(fact_check_utils, "search_google", searched.append)

    result = fact_check_utils.run_fact_check_pipeline(
        {"cleaned_text": "A long enough sentence about the new bridge opening.", "status": "error"}
    )

    assert result == ([], "Claim extraction failed.")
    assert searched == []


def test_perspective_requires_article_text(monkeypatch, fake_chat_client):
    client = fake_chat_client()
    monkeypatch.setattr(perspective_module, "client", client)

    result = perspective_module.generate_perspective({"cleaned_text": "", "facts": []})

    assert result == {
        "status": "error",
        "error_from": "generate_perspective",
        "message": "Missing or empty 'cleaned_text' in state",
    }
    assert client.requests == []
