"""Tests for app.modules.pipeline: the scraper stage and the compiled LangGraph workflow end to end.

Only the outside services are faked (page fetch, Groq, web search, Pinecone); every node, the
graph routing, chunking, embedding and storage run for real.
"""

import json

import pytest
import rake_nltk

from app.config import PERSPECTIVE_MAX_RETRIES, PERSPECTIVE_MIN_SCORE, PINECONE_NAMESPACE
from app.modules import pipeline
from app.modules.facts_check import llm_processing as facts_llm
from app.modules.langgraph_nodes import generate_perspective as perspective_module
from app.modules.langgraph_nodes import judge as judge_module
from app.modules.langgraph_nodes import sentiment as sentiment_module
from app.modules.langgraph_nodes import store_and_send as store_module
from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput
from app.modules.scraper import keywords as keywords_module
from app.modules.scraper.keywords import DEFAULT_STOPWORDS
from app.utils import fact_check_utils
from app.utils.generate_chunk_id import generate_id

URL = "https://news.example.com/bridge"
ARTICLE = (
    "The new bridge cost 40 million dollars to build and opened in March. "
    "Officials expect it to carry ten thousand cars every single day."
)


# --- run_scraper_pipeline -------------------------------------------------------------


def test_scraper_pipeline_cleans_the_extracted_text_and_extracts_keywords(monkeypatch):
    seen_urls = []

    class FakeExtractor:
        def __init__(self, url):
            seen_urls.append(url)

        def extract(self):
            return {"url": URL, "title": "Bridge", "text": "Menu\n\nAdvertisement\n\nCouncil approves funding for the riverside bridge.\nShare\n"}

    class NoRake:
        def __init__(self, stopwords):
            raise LookupError("punkt_tab not found")

    monkeypatch.setattr(pipeline, "Article_extractor", FakeExtractor)
    monkeypatch.setattr(rake_nltk, "Rake", NoRake)
    monkeypatch.setattr(keywords_module, "STOPWORDS_SET", DEFAULT_STOPWORDS)

    result = pipeline.run_scraper_pipeline(URL)

    assert seen_urls == [URL]
    assert result == {
        "cleaned_text": "Council approves funding for the riverside bridge.",
        "keywords": ["council", "approves", "funding", "riverside", "bridge"],
    }


def test_scraper_pipeline_handles_a_failed_extraction(monkeypatch):
    class FailingExtractor:
        def __init__(self, url):
            pass

        def extract(self):
            return {"url": URL, "text": "", "error": "Failed to extract article."}

    monkeypatch.setattr(pipeline, "Article_extractor", FailingExtractor)

    assert pipeline.run_scraper_pipeline(URL) == {"cleaned_text": "", "keywords": []}


# --- run_langgraph_workflow -------------------------------------------------------------


def verdict(claim, value):
    return json.dumps(
        {"verdict": value, "explanation": f"{claim} checked.", "original_claim": claim, "source_link": "https://src.example"}
    )


@pytest.fixture
def services(monkeypatch, fake_chat_client, fake_index):
    """Fake Groq, web search and Pinecone for a full workflow run."""
    claims = ["The bridge cost 40 million dollars.", "The bridge opened in March this year."]
    clients = {
        "sentiment": fake_chat_client("Positive"),
        "facts": fake_chat_client(
            "\n".join(f"{i + 1}. {c}" for i, c in enumerate(claims)),
            verdict(claims[0], "True"),
            verdict(claims[1], "False"),
        ),
        "perspective": fake_chat_client(
            # One reply per allowed attempt, so a retry never runs out of queued replies
            *[
                json.dumps({"reasoning": f"Reasoning {i}.", "perspective": f"Perspective {i}."})
                for i in range(1, PERSPECTIVE_MAX_RETRIES + 1)
            ]
        ),
        "judge": fake_chat_client(str(PERSPECTIVE_MIN_SCORE + 10)),
    }
    searched = []

    def search(claim):
        searched.append(claim)
        return [{"title": f"About {claim}", "link": "https://src.example", "snippet": "Evidence."}]

    monkeypatch.setattr(sentiment_module, "client", clients["sentiment"])
    monkeypatch.setattr(facts_llm, "client", clients["facts"])
    monkeypatch.setattr(perspective_module, "client", clients["perspective"])
    monkeypatch.setattr(judge_module, "client", clients["judge"])
    monkeypatch.setattr(fact_check_utils, "search_google", search)
    return {"clients": clients, "claims": claims, "searched": searched, "index": fake_index}


def test_workflow_analyses_and_stores_an_article(services):
    result = pipeline.run_langgraph_workflow({"cleaned_text": ARTICLE, "keywords": ["bridge"]})

    claims = services["claims"]
    assert result["status"] == "success"
    assert result["sentiment"] == "positive"
    assert [(f["original_claim"], f["verdict"]) for f in result["facts"]] == [(claims[0], "True"), (claims[1], "False")]
    assert result["perspective"] == PerspectiveOutput(reasoning="Reasoning 1.", perspective="Perspective 1.")
    assert result["score"] == PERSPECTIVE_MIN_SCORE + 10
    assert result["retries"] == 1
    assert sorted(services["searched"]) == sorted(claims)

    # The perspective prompt carries the verified facts and the detected sentiment.
    perspective_prompt = services["clients"]["perspective"].requests[0]["messages"][-1]["content"]
    assert f"Claim: {claims[1]}\nVerdict: False" in perspective_prompt
    assert "Detected Sentiment: positive" in perspective_prompt

    [upsert] = services["index"].upserts
    article_id = generate_id(ARTICLE)
    assert upsert["namespace"] == PINECONE_NAMESPACE
    assert [v["id"] for v in upsert["vectors"]] == [
        f"{article_id}-perspective",
        f"{article_id}-fact-0",
        f"{article_id}-fact-1",
    ]


def test_workflow_regenerates_low_scoring_perspectives_up_to_the_limit(services, fake_chat_client, monkeypatch):
    judge_client = fake_chat_client(*[str(PERSPECTIVE_MIN_SCORE - 1)] * PERSPECTIVE_MAX_RETRIES)
    monkeypatch.setattr(judge_module, "client", judge_client)

    result = pipeline.run_langgraph_workflow({"cleaned_text": ARTICLE})

    assert result["status"] == "success"
    assert result["retries"] == PERSPECTIVE_MAX_RETRIES
    assert len(services["clients"]["perspective"].requests) == PERSPECTIVE_MAX_RETRIES
    assert result["perspective"].perspective == f"Perspective {PERSPECTIVE_MAX_RETRIES}."
    # The last attempt is stored even though it never reached the minimum score.
    assert len(services["index"].upserts) == 1


def test_workflow_stops_at_the_first_failing_step(services, fake_chat_client, monkeypatch):
    monkeypatch.setattr(sentiment_module, "client", fake_chat_client(ConnectionError("groq unavailable")))

    result = pipeline.run_langgraph_workflow({"cleaned_text": ARTICLE})

    # Only "status" is checked: the node's error_from/message (and the handler's from/error) are
    # not keys of MyState, so LangGraph currently drops them from the result.
    assert result["status"] == "stopped_due_to_error"
    assert result["cleaned_text"] == ARTICLE
    assert services["clients"]["facts"].requests == []
    assert services["clients"]["perspective"].requests == []
    assert services["index"].upserts == []


# --- store_and_send skips storage when there is nothing to store ---------------------------------


@pytest.mark.parametrize("empty_step", ["chunk_rag_data", "embed_chunks"])
def test_store_and_send_skips_the_upsert_when_a_step_yields_nothing(monkeypatch, fake_index, empty_step):
    monkeypatch.setattr(store_module, empty_step, lambda *args: [])
    state = {
        "cleaned_text": ARTICLE,
        "facts": [],
        "perspective": PerspectiveOutput(reasoning="r", perspective="p"),
    }

    assert store_module.store_and_send(state) == {**state, "status": "success"}
    assert fake_index.upserts == []
