"""Tests for the HTTP API in main.py / app/routes/routes.py, with the scraper, pipeline and LLM calls faked."""

import pytest
from fastapi.testclient import TestClient

from app.modules.langgraph_nodes.generate_perspective import PerspectiveOutput
from app.routes import routes
from main import app

PUBLIC_IP = "93.184.215.14"
ARTICLE_URL = "https://news.example.com/story"
SCRAPED = {"cleaned_text": "Article text long enough to analyse.", "keywords": ["article text"]}
HTTP_OK = 200
HTTP_BAD_REQUEST = 400
HTTP_UNPROCESSABLE = 422


@pytest.fixture
def client():
    return TestClient(app)


@pytest.fixture
def backend(monkeypatch, resolve_hosts):
    """Fake everything the routes call and record the arguments."""
    resolve_hosts({"news.example.com": [PUBLIC_IP], "intranet.example.com": ["10.0.0.7"]})
    calls = {}

    def record(name, result):
        def fake(*args):
            calls[name] = args
            return result

        return fake

    monkeypatch.setattr(routes, "run_scraper_pipeline", record("scrape", SCRAPED))
    monkeypatch.setattr(routes, "check_bias", record("bias", {"bias_score": 42, "status": "success"}))
    monkeypatch.setattr(
        routes,
        "run_langgraph_workflow",
        record(
            "workflow",
            {
                "cleaned_text": SCRAPED["cleaned_text"],
                "sentiment": "neutral",
                "facts": [],
                "perspective": PerspectiveOutput(reasoning="Why.", perspective="What else."),
                "score": 80,
                "retries": 1,
                "status": "success",
            },
        ),
    )
    matches = [{"id": "article-abc-perspective", "score": 0.8, "metadata": {"reasoning": "Why."}}]
    monkeypatch.setattr(routes, "search_pinecone", record("search", matches))
    monkeypatch.setattr(routes, "ask_llm", record("ask", "Because of why."))
    calls["matches"] = matches
    return calls


def test_health_check(client):
    response = client.get("/api/")

    assert response.status_code == HTTP_OK
    assert response.json() == {"message": "Perspective API is live!"}


def test_bias_scrapes_the_url_and_returns_the_score(client, backend):
    response = client.post("/api/bias", json={"url": ARTICLE_URL})

    assert response.status_code == HTTP_OK
    assert response.json() == {"bias_score": 42, "status": "success"}
    assert backend["scrape"] == (ARTICLE_URL,)
    assert backend["bias"] == (SCRAPED,)


def test_process_runs_the_workflow_on_the_scraped_article(client, backend):
    response = client.post("/api/process", json={"url": ARTICLE_URL})

    assert response.status_code == HTTP_OK
    body = response.json()
    assert body["perspective"] == {"reasoning": "Why.", "perspective": "What else."}
    assert body["status"] == "success"
    assert backend["workflow"] == (SCRAPED,)


def test_chat_answers_from_the_retrieved_context(client, backend):
    response = client.post("/api/chat", json={"message": "Why?"})

    assert response.status_code == HTTP_OK
    assert response.json() == {"answer": "Because of why."}
    assert backend["search"] == ("Why?",)
    assert backend["ask"] == ("Why?", backend["matches"])


@pytest.mark.parametrize("path", ["/api/bias", "/api/process"])
@pytest.mark.parametrize("body", [{}, {"url": None}, {"url": 123}, {"link": ARTICLE_URL}])
def test_url_endpoints_reject_malformed_bodies(client, backend, path, body):
    response = client.post(path, json=body)

    assert response.status_code == HTTP_UNPROCESSABLE
    assert response.json()["detail"][0]["loc"] == ["body", "url"]
    assert "scrape" not in backend


@pytest.mark.parametrize("body", [{}, {"message": None}, {"query": "Why?"}])
def test_chat_rejects_malformed_bodies(client, backend, body):
    response = client.post("/api/chat", json=body)

    assert response.status_code == HTTP_UNPROCESSABLE
    assert response.json()["detail"][0]["loc"] == ["body", "message"]
    assert "search" not in backend


@pytest.mark.parametrize("path", ["/api/bias", "/api/process"])
@pytest.mark.parametrize(
    ("url", "detail"),
    [
        ("ftp://news.example.com/story", "Only http and https URLs are allowed."),
        ("not a url", "Only http and https URLs are allowed."),
        ("http://intranet.example.com/admin", "The URL points to a private or reserved address."),
        ("https://unknown-host.example/", "The URL's host could not be resolved."),
    ],
)
def test_url_endpoints_reject_unsafe_urls_before_scraping(client, backend, path, url, detail):
    response = client.post(path, json={"url": url})

    assert response.status_code == HTTP_BAD_REQUEST
    assert response.json() == {"detail": detail}
    assert "scrape" not in backend
