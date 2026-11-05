"""Tests for the fact-checking pipeline with the claim extractor, web search and verifier faked."""

import pytest

from app.config import MAX_CLAIMS
from app.modules.facts_check import llm_processing
from app.modules.langgraph_nodes.fact_check import run_fact_check
from app.utils import fact_check_utils
from app.utils.fact_check_utils import run_fact_check_pipeline

ARTICLE = (
    "The new bridge cost 40 million dollars to build. "
    "It opened to traffic in March after two years of work. "
    "Officials expect it to carry ten thousand cars a day."
)


@pytest.fixture
def pipeline(monkeypatch):
    """Fake the extractor, search and verifier; return what each one received."""
    seen = {"searched": [], "verified": None}
    config = {"claims_output": "", "search": None}

    def extract(state):
        return {**state, "verifiable_claims": config["claims_output"], "status": "success"}

    def search(claim):
        seen["searched"].append(claim)
        if config["search"]:
            return config["search"](claim)
        return [{"title": f"Result for {claim}", "link": "https://example.com", "snippet": "..."}]

    def verify(search_results):
        seen["verified"] = search_results
        return {
            "verifications": [
                {
                    "verdict": "True",
                    "explanation": "Supported.",
                    "original_claim": r["claim"],
                    "source_link": r["link"],
                }
                for r in search_results
            ],
            "status": "success",
        }

    monkeypatch.setattr(fact_check_utils, "run_claim_extractor_sdk", extract)
    monkeypatch.setattr(fact_check_utils, "search_google", search)
    monkeypatch.setattr(fact_check_utils, "run_fact_verifier_sdk", verify)
    return config, seen


def state():
    return {"cleaned_text": ARTICLE, "status": "success"}


def test_parses_bulleted_and_numbered_claims_and_drops_headers(pipeline):
    config, seen = pipeline
    config["claims_output"] = (
        "Here are the verifiable claims:\n"
        "1. The bridge cost 40 million dollars.\n"
        "- The bridge opened in March this year.\n"
        "\n"
        "* ok\n"
        "• Ten thousand cars cross it every day.\n"
    )

    verifications, error = run_fact_check_pipeline(state())

    assert error is None
    assert [v["original_claim"] for v in verifications] == [
        "The bridge cost 40 million dollars.",
        "The bridge opened in March this year.",
        "Ten thousand cars cross it every day.",
    ]


def test_checks_at_most_the_configured_number_of_claims_in_order(pipeline):
    config, seen = pipeline
    claims = [f"Claim number {i} about the new bridge." for i in range(MAX_CLAIMS + 2)]
    config["claims_output"] = "\n".join(f"{i + 1}) {c}" for i, c in enumerate(claims))

    verifications, error = run_fact_check_pipeline(state())

    assert error is None
    assert sorted(seen["searched"]) == sorted(claims[:MAX_CLAIMS])
    assert [r["claim"] for r in seen["verified"]] == claims[:MAX_CLAIMS]


def test_falls_back_to_article_sentences_when_no_claims_parse(pipeline):
    config, seen = pipeline
    config["claims_output"] = "None\nn/a"

    verifications, error = run_fact_check_pipeline(state())

    assert error is None
    assert [v["original_claim"] for v in verifications] == [
        "The new bridge cost 40 million dollars to build",
        "It opened to traffic in March after two years of work",
        "Officials expect it to carry ten thousand cars a day.",
    ][:MAX_CLAIMS]


def test_reports_an_error_when_there_is_nothing_to_check(pipeline):
    config, seen = pipeline
    config["claims_output"] = ""

    verifications, error = run_fact_check_pipeline({"cleaned_text": "Too short.", "status": "success"})

    assert verifications == []
    assert error == "No verifiable claims found."
    assert seen["searched"] == []


def test_skips_claims_whose_search_fails_or_finds_nothing(pipeline):
    config, seen = pipeline
    config["claims_output"] = "1. First claim about the bridge.\n2. Second claim about the bridge.\n3. Third claim about the bridge."

    def search(claim):
        if claim.startswith("First"):
            raise TimeoutError("search timed out")
        if claim.startswith("Second"):
            return []
        return [{"title": "t", "link": "https://example.com/third", "snippet": "s"}]

    config["search"] = search

    verifications, error = run_fact_check_pipeline(state())

    assert error is None
    assert [v["original_claim"] for v in verifications] == ["Third claim about the bridge."]


def test_does_not_verify_without_any_search_evidence(pipeline):
    config, seen = pipeline
    config["claims_output"] = "1. A claim that nobody has written about."
    config["search"] = lambda claim: []

    verifications, error = run_fact_check_pipeline(state())

    assert verifications == []
    assert error == "No search results available for fact verification."
    assert seen["verified"] is None


# --- LangGraph node wrapper ---------------------------------------------------------


def test_node_adds_facts_to_the_state(pipeline):
    config, _ = pipeline
    config["claims_output"] = "1. The bridge cost 40 million dollars."

    result = run_fact_check(state())

    assert result["status"] == "success"
    assert result["cleaned_text"] == ARTICLE
    assert [f["original_claim"] for f in result["facts"]] == ["The bridge cost 40 million dollars."]


def test_node_reports_pipeline_errors(pipeline):
    config, _ = pipeline
    config["search"] = lambda claim: []
    config["claims_output"] = "1. A claim that nobody has written about."

    result = run_fact_check(state())

    assert result == {
        "status": "error",
        "error_from": "fact_checking",
        "message": "No search results available for fact verification.",
    }


def test_node_rejects_missing_text():
    result = run_fact_check({"cleaned_text": ""})

    assert result["status"] == "error"
    assert result["error_from"] == "fact_checking"


# --- Verifier response parsing ----------------------------------------------------------


def test_verifier_parses_json_wrapped_in_a_code_fence(monkeypatch, fake_chat_client):
    client = fake_chat_client(
        '```json\n{"verdict": "False", "explanation": "Cost was 60 million.", '
        '"original_claim": "Cost 40 million", "source_link": "https://news.example/a"}\n```'
    )
    monkeypatch.setattr(llm_processing, "client", client)

    result = llm_processing.run_fact_verifier_sdk(
        [{"claim": "Cost 40 million", "title": "Bridge costs", "snippet": "60 million", "link": "https://news.example/a"}]
    )

    assert result["status"] == "success"
    assert result["verifications"] == [
        {
            "verdict": "False",
            "explanation": "Cost was 60 million.",
            "original_claim": "Cost 40 million",
            "source_link": "https://news.example/a",
        }
    ]
    assert "Cost 40 million" in client.requests[0]["messages"][1]["content"]


def test_verifier_marks_unparseable_replies_as_unverified(monkeypatch, fake_chat_client):
    monkeypatch.setattr(llm_processing, "client", fake_chat_client("I think it is probably true."))

    result = llm_processing.run_fact_verifier_sdk([{"claim": "Some claim", "link": "https://news.example/b"}])

    assert result["verifications"] == [
        {
            "verdict": "Unverified",
            "explanation": "The verifier response could not be parsed.",
            "original_claim": "Some claim",
            "source_link": "https://news.example/b",
        }
    ]
