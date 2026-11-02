"""Tests for the LangGraph workflow's routing: success path, retry loop and error handling."""

import pytest

from app.config import PERSPECTIVE_MAX_RETRIES, PERSPECTIVE_MIN_SCORE
from app.modules import langgraph_builder
from app.modules.langgraph_nodes import (
    fact_check,
    generate_perspective,
    judge,
    sentiment,
    store_and_send,
)
from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput

FACT = {
    "original_claim": "The plan costs 5M.",
    "verdict": "False",
    "explanation": "It costs 9M.",
    "source_link": "https://example.com/budget",
}
PASSING_SCORE = PERSPECTIVE_MIN_SCORE
FAILING_SCORE = PERSPECTIVE_MIN_SCORE - 1


@pytest.fixture
def nodes(monkeypatch):
    """Replace every node with a fake; `config` controls them and `calls` records the order they ran in."""
    calls = []
    config = {"scores": [PASSING_SCORE], "fail_at": None}

    def node(name, update):
        def run(state):
            calls.append(name)
            if config["fail_at"] == name:
                return {"status": "error", "error_from": name, "message": f"{name} failed"}
            return {**state, **update(state), "status": "success"}

        return run

    def next_score(state):
        scores = config["scores"]
        return {"score": scores.pop(0) if len(scores) > 1 else scores[0]}

    monkeypatch.setattr(sentiment, "run_sentiment_sdk", node("sentiment", lambda s: {"sentiment": "negative"}))
    monkeypatch.setattr(fact_check, "run_fact_check", node("fact_check", lambda s: {"facts": [FACT]}))
    monkeypatch.setattr(
        generate_perspective,
        "generate_perspective",
        node(
            "generate",
            lambda s: {
                "retries": s.get("retries", 0) + 1,
                "perspective": PerspectiveOutput(reasoning="r", perspective="p"),
            },
        ),
    )
    monkeypatch.setattr(judge, "judge_perspective", node("judge", next_score))
    monkeypatch.setattr(store_and_send, "store_and_send", node("store", lambda s: {}))
    return config, calls


def run(state=None):
    return langgraph_builder.build_langgraph().invoke(state or {"cleaned_text": "Article text.", "keywords": ["k"]})


def test_a_passing_perspective_is_stored_after_one_attempt(nodes):
    _, calls = nodes

    result = run()

    assert calls == ["sentiment", "fact_check", "generate", "judge", "store"]
    assert result == {
        "cleaned_text": "Article text.",
        "sentiment": "negative",
        "facts": [FACT],
        "perspective": PerspectiveOutput(reasoning="r", perspective="p"),
        "score": PASSING_SCORE,
        "retries": 1,
        "status": "success",
    }


def test_input_keys_outside_the_state_schema_are_not_returned(nodes):
    # The scraper's keywords are passed in but are not part of the response.
    assert "keywords" not in run()


def test_a_low_score_regenerates_the_perspective_until_it_passes(nodes):
    config, calls = nodes
    config["scores"] = [FAILING_SCORE, PASSING_SCORE]

    result = run()

    assert calls.count("generate") == 2
    assert calls[-1] == "store"
    assert result["retries"] == 2
    assert result["score"] == PASSING_SCORE


def test_regeneration_stops_after_the_retry_limit(nodes):
    config, calls = nodes
    config["scores"] = [FAILING_SCORE]

    result = run()

    assert calls.count("generate") == PERSPECTIVE_MAX_RETRIES
    assert calls[-1] == "store"
    assert result["retries"] == PERSPECTIVE_MAX_RETRIES
    assert result["status"] == "success"


@pytest.mark.parametrize("failing", ["sentiment", "fact_check", "generate", "judge", "store"])
def test_a_failing_step_stops_the_workflow(nodes, failing):
    config, calls = nodes
    config["fail_at"] = failing

    result = run()

    assert calls[-1] == failing
    assert result["status"] == "stopped_due_to_error"
    assert result["cleaned_text"] == "Article text."
