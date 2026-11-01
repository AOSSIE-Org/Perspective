"""Tests for how the LLM-backed steps build requests and parse replies, with the Groq client faked."""

import json

import pytest

from app.config import (
    BIAS_MODEL,
    CHAT_MODEL,
    JUDGE_MODEL,
    PERSPECTIVE_MODEL,
    RAG_TOP_K,
    PINECONE_NAMESPACE,
    SENTIMENT_MODEL,
)
from app.modules.bias_detection import check_bias as check_bias_module
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat import get_rag_data
from app.modules.chat import llm_processing as chat_llm
from app.modules.langgraph_nodes import generate_perspective as perspective_module
from app.modules.langgraph_nodes import judge as judge_module
from app.modules.langgraph_nodes import sentiment as sentiment_module
from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput

ARTICLE = "The council's plan is the only sensible choice and critics are simply wrong."
NO_TEXT_MESSAGE = "No readable text could be extracted from this article."


# --- check_bias -----------------------------------------------------------------


@pytest.mark.parametrize(
    ("reply", "expected"),
    [
        ("72", 72),
        ("Bias score: 35", 35),
        ("0", 0),
        ("100", 100),
        ("250", 100),
    ],
)
def test_check_bias_extracts_and_clamps_the_score(monkeypatch, fake_chat_client, reply, expected):
    monkeypatch.setattr(check_bias_module, "client", fake_chat_client(reply))

    assert check_bias({"cleaned_text": ARTICLE, "keywords": []}) == {"bias_score": expected, "status": "success"}


def test_check_bias_sends_the_article_text_to_the_configured_model(monkeypatch, fake_chat_client):
    client = fake_chat_client("40")
    monkeypatch.setattr(check_bias_module, "client", client)

    check_bias({"cleaned_text": ARTICLE, "keywords": ["council"]})

    [request] = client.requests
    assert request["model"] == BIAS_MODEL
    assert ARTICLE in request["messages"][-1]["content"]


def test_check_bias_reports_an_unparseable_reply(monkeypatch, fake_chat_client):
    monkeypatch.setattr(check_bias_module, "client", fake_chat_client("I cannot score this."))

    result = check_bias({"cleaned_text": ARTICLE})

    assert result["status"] == "error"
    assert result["error_from"] == "bias_detection"
    assert "No parseable score" in result["message"]


@pytest.mark.parametrize("scraped", [{"cleaned_text": "", "keywords": []}, {"cleaned_text": "   "}, "", None])
def test_check_bias_reports_articles_without_text_without_calling_the_llm(monkeypatch, fake_chat_client, scraped):
    client = fake_chat_client()
    monkeypatch.setattr(check_bias_module, "client", client)

    assert check_bias(scraped) == {"status": "error", "error_from": "bias_detection", "message": NO_TEXT_MESSAGE}
    assert client.requests == []


def test_check_bias_reports_api_failures(monkeypatch, fake_chat_client):
    monkeypatch.setattr(check_bias_module, "client", fake_chat_client(ConnectionError("groq unavailable")))

    result = check_bias({"cleaned_text": ARTICLE})

    assert result == {"status": "error", "error_from": "bias_detection", "message": "groq unavailable"}


# --- sentiment --------------------------------------------------------------------


def test_sentiment_is_lower_cased_and_added_to_the_state(monkeypatch, fake_chat_client):
    client = fake_chat_client("  Negative \n")
    monkeypatch.setattr(sentiment_module, "client", client)

    result = sentiment_module.run_sentiment_sdk({"cleaned_text": ARTICLE})

    assert result == {"cleaned_text": ARTICLE, "sentiment": "negative", "status": "success"}
    assert client.requests[0]["model"] == SENTIMENT_MODEL


def test_sentiment_reports_missing_text(monkeypatch, fake_chat_client):
    monkeypatch.setattr(sentiment_module, "client", fake_chat_client())

    result = sentiment_module.run_sentiment_sdk({"cleaned_text": ""})

    assert result["status"] == "error"
    assert result["error_from"] == "sentiment_analysis"


# --- generate_perspective -------------------------------------------------------------


def test_perspective_is_parsed_and_retries_are_counted(monkeypatch, fake_chat_client):
    client = fake_chat_client(json.dumps({"reasoning": "Because of X.", "perspective": "Consider Y."}))
    monkeypatch.setattr(perspective_module, "client", client)
    facts = [{"original_claim": "Plan costs 5M", "verdict": "False", "explanation": "It costs 9M."}]

    result = perspective_module.generate_perspective(
        {"cleaned_text": ARTICLE, "facts": facts, "sentiment": "positive", "retries": 1}
    )

    assert result["status"] == "success"
    assert result["retries"] == 2
    assert result["perspective"] == PerspectiveOutput(reasoning="Because of X.", perspective="Consider Y.")
    [request] = client.requests
    assert request["model"] == PERSPECTIVE_MODEL
    prompt = request["messages"][-1]["content"]
    assert "Claim: Plan costs 5M" in prompt
    assert "Verdict: False" in prompt
    assert "Detected Sentiment: positive" in prompt


def test_perspective_accepts_the_counter_perspective_key(monkeypatch, fake_chat_client):
    monkeypatch.setattr(perspective_module, "client", fake_chat_client(json.dumps({"counter_perspective": "Consider Z."})))

    result = perspective_module.generate_perspective({"cleaned_text": ARTICLE})

    assert result["perspective"].perspective == "Consider Z."
    assert result["retries"] == 1


def test_perspective_reports_invalid_json(monkeypatch, fake_chat_client):
    monkeypatch.setattr(perspective_module, "client", fake_chat_client("not json"))

    result = perspective_module.generate_perspective({"cleaned_text": ARTICLE})

    assert result["status"] == "error"
    assert result["error_from"] == "generate_perspective"


# --- judge ------------------------------------------------------------------------------


def perspective_state(text="A thoughtful counter-perspective."):
    return {"cleaned_text": ARTICLE, "perspective": PerspectiveOutput(reasoning="r", perspective=text)}


@pytest.mark.parametrize(("reply", "expected"), [("85", 85), ("Score: 64/100", 64), ("999", 100), ("no idea", 0)])
def test_judge_extracts_and_clamps_the_score(monkeypatch, fake_chat_client, reply, expected):
    client = fake_chat_client(reply)
    monkeypatch.setattr(judge_module, "client", client)

    result = judge_module.judge_perspective(perspective_state())

    assert result["score"] == expected
    assert result["status"] == "success"
    assert client.requests[0]["model"] == JUDGE_MODEL


def test_judge_scores_an_empty_perspective_zero_without_calling_the_llm(monkeypatch, fake_chat_client):
    client = fake_chat_client()
    monkeypatch.setattr(judge_module, "client", client)

    result = judge_module.judge_perspective(perspective_state(text="   "))

    assert result["score"] == 0
    assert client.requests == []


def test_judge_reports_api_failures(monkeypatch, fake_chat_client):
    monkeypatch.setattr(judge_module, "client", fake_chat_client(TimeoutError("timed out")))

    result = judge_module.judge_perspective(perspective_state())

    assert result["status"] == "error"
    assert result["error_from"] == "judge"


# --- chat (RAG) ------------------------------------------------------------------------------


def test_build_context_prefers_explanations_and_falls_back_to_reasoning():
    docs = [
        {"metadata": {"type": "fact", "explanation": "Fact explanation."}},
        {"metadata": {"type": "counter-perspective", "reasoning": "Perspective reasoning."}},
        {"metadata": {"type": "other"}},
    ]

    assert chat_llm.build_context(docs) == "Fact explanation.\nPerspective reasoning.\n"


def test_ask_llm_sends_the_question_with_the_retrieved_context(monkeypatch, fake_chat_client):
    client = fake_chat_client("The budget is 9M.")
    monkeypatch.setattr(chat_llm, "client", client)

    answer = chat_llm.ask_llm("How much does it cost?", [{"metadata": {"explanation": "It costs 9M."}}])

    assert answer == "The budget is 9M."
    [request] = client.requests
    assert request["model"] == CHAT_MODEL
    prompt = request["messages"][-1]["content"]
    assert "How much does it cost?" in prompt
    assert "It costs 9M." in prompt


def test_search_pinecone_queries_the_index_and_returns_matches(fake_index):
    fake_index.matches = [{"id": "article-abc-fact-0", "score": 0.91, "metadata": {"type": "fact"}, "values": []}]

    matches = get_rag_data.search_pinecone("Who approved the budget?")

    assert matches == [{"id": "article-abc-fact-0", "score": 0.91, "metadata": {"type": "fact"}}]
    [query] = fake_index.queries
    assert query["top_k"] == RAG_TOP_K
    assert query["namespace"] == PINECONE_NAMESPACE
    assert query["include_metadata"] is True
    assert query["vector"][0] == float(len("Who approved the budget?"))
