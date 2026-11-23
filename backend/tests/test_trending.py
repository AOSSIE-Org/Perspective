"""
test_trending.py
----------------
Unit tests for the dynamic trending topics engine:
- Cache semantics (TTL, stale-while-revalidate, thread-safety)
- Safe RSS feed parsing (RSS 2.0, Atom, SSRF rejection, malformed XML)
- Groq-based topic evaluation and formatting
- GET /api/trending HTTP endpoint
"""

import time
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

from app.modules.trending.cache import TrendingCache
from app.modules.trending.feed_parser import (
    fetch_rss_feed,
    fetch_rss_stories,
    parse_rss_xml,
)
from app.modules.trending.evaluator import (
    evaluate_and_generate_topics,
    evaluate_topic_suitability,
    format_preset_topic,
)
from app.routes import routes
from main import app

SAMPLE_RSS_XML = """<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>News Feed</title>
    <item>
      <title>Global Climate Accord Reached</title>
      <link>https://news.example.com/climate</link>
      <description>Delegates have agreed on new carbon offset metrics.</description>
      <pubDate>Mon, 23 Nov 2026 10:00:00 GMT</pubDate>
    </item>
    <item>
      <title>Internal Server Probe</title>
      <link>http://127.0.0.1/admin</link>
      <description>Malicious SSRF attempt inside feed.</description>
      <pubDate>Mon, 23 Nov 2026 11:00:00 GMT</pubDate>
    </item>
  </channel>
</rss>
"""

SAMPLE_ATOM_XML = """<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Atom Feed</title>
  <entry>
    <title>Quantum Computing Milestone</title>
    <link href="https://news.example.com/quantum"/>
    <summary>Scientists announce 1000-qubit fault tolerant chip.</summary>
    <published>2026-11-23T12:00:00Z</published>
  </entry>
</feed>
"""


@pytest.fixture
def client():
    return TestClient(app)


def test_trending_cache_basic_and_stale():
    cache = TrendingCache(ttl_seconds=1)
    assert cache.get() is None
    assert cache.is_stale() is True

    items = [{"id": "t1", "title": "Topic 1"}]
    cache.set(items)
    assert cache.get() == items
    assert cache.is_stale() is False

    # Sleep past TTL
    time.sleep(1.1)
    assert cache.is_stale() is True
    # Still returns stale data while marked stale
    assert cache.get() == items

    cache.clear()
    assert cache.get() is None


def test_trending_cache_refreshing_flag():
    cache = TrendingCache()
    assert cache.mark_refreshing() is True
    # Second concurrent attempt fails
    assert cache.mark_refreshing() is False
    assert cache.is_refreshing is True

    cache.set([{"id": "t2"}])
    assert cache.is_refreshing is False


def test_parse_rss_xml_extracts_and_filters_ssrf(resolve_hosts):
    resolve_hosts({"news.example.com": ["93.184.215.14"]})
    stories = parse_rss_xml(SAMPLE_RSS_XML)
    # The valid external item passes; the 127.0.0.1 link is rejected
    assert len(stories) == 1
    assert stories[0]["title"] == "Global Climate Accord Reached"
    assert stories[0]["url"] == "https://news.example.com/climate"
    assert "carbon offset" in stories[0]["description"]


def test_parse_atom_xml_extracts_entry(resolve_hosts):
    resolve_hosts({"news.example.com": ["93.184.215.14"]})
    stories = parse_rss_xml(SAMPLE_ATOM_XML)
    assert len(stories) == 1
    assert stories[0]["title"] == "Quantum Computing Milestone"
    assert stories[0]["url"] == "https://news.example.com/quantum"
    assert "1000-qubit" in stories[0]["description"]


def test_parse_rss_xml_malformed_returns_empty():
    assert parse_rss_xml("not valid xml <<<") == []


def test_fetch_rss_feed_and_aggregation(monkeypatch, resolve_hosts):
    resolve_hosts({"news.example.com": ["93.184.215.14"]})

    class FakeResponse:
        status_code = 200
        text = SAMPLE_RSS_XML

    monkeypatch.setattr("requests.get", lambda *args, **kwargs: FakeResponse())
    stories = fetch_rss_feed("https://news.example.com/rss")
    assert len(stories) == 1

    all_stories = fetch_rss_stories(["https://news.example.com/rss1", "https://news.example.com/rss2"])
    # URL deduplication ensures only 1 unique URL is aggregated
    assert len(all_stories) == 1


def test_fetch_rss_feed_http_error(monkeypatch, resolve_hosts):
    resolve_hosts({"news.example.com": ["93.184.215.14"]})

    class FakeResponse:
        status_code = 500
        text = "Server error"

    monkeypatch.setattr("requests.get", lambda *args, **kwargs: FakeResponse())
    assert fetch_rss_feed("https://news.example.com/rss") == []


def test_evaluate_topic_suitability_and_fallback():
    # Test valid LLM response
    fake_client = MagicMock()
    fake_choice = MagicMock()
    fake_choice.message.content = (
        '{"is_suitable": true, "bias_score": 60, "category": "Climate", '
        '"explanation": "Economic impact debate.", "counter_perspective": "Developing nations argue equity.", '
        '"sentiment": "Critical"}'
    )
    fake_client.chat.completions.create.return_value.choices = [fake_choice]

    story = {"title": "Test story", "description": "Story summary"}
    res = evaluate_topic_suitability(story, client=fake_client)
    assert res["is_suitable"] is True
    assert res["bias_score"] == 60

    # Test fallback on exception
    broken_client = MagicMock()
    broken_client.chat.completions.create.side_effect = RuntimeError("Groq down")
    fallback = evaluate_topic_suitability(story, client=broken_client)
    assert fallback["is_suitable"] is False


def test_format_preset_topic_structure():
    story = {
        "title": "AI Regulation Bill Passes",
        "url": "https://news.example.com/ai",
        "description": "Congress approves AI audit standards.",
        "published_at": "2026-11-23",
    }
    eval_result = {
        "bias_score": 40,
        "category": "Tech Policy",
        "explanation": "Stifling innovation vs public safety.",
        "counter_perspective": "Startups warn against premature regulation.",
        "sentiment": "Neutral",
    }
    topic = format_preset_topic(story, eval_result)
    assert topic["id"].startswith("dynamic-")
    assert topic["title"] == "AI Regulation Bill Passes"
    assert topic["url"] == "https://news.example.com/ai"
    assert topic["biasScore"]["bias_score"] == 40
    assert topic["analysisResult"]["perspective"] == "Startups warn against premature regulation."


def test_evaluate_and_generate_topics():
    fake_client = MagicMock()
    fake_choice = MagicMock()
    fake_choice.message.content = (
        '{"is_suitable": true, "bias_score": 55, "category": "Politics", '
        '"explanation": "Why debate exists.", "counter_perspective": "Other perspective.", '
        '"sentiment": "Neutral"}'
    )
    fake_client.chat.completions.create.return_value.choices = [fake_choice]

    stories = [
        {"title": f"Story {i}", "url": f"https://news.example.com/{i}", "description": f"Desc {i}"}
        for i in range(5)
    ]
    topics = evaluate_and_generate_topics(stories, client=fake_client, max_topics=2)
    assert len(topics) == 2
    assert topics[0]["title"] == "Story 0"
    assert topics[1]["title"] == "Story 1"


def test_get_trending_api_endpoint(client, monkeypatch):
    from app.modules.trending.cache import trending_cache

    trending_cache.clear()

    # Case 1: Empty cache triggers synchronous fetch & format
    sample_topic = {
        "id": "dynamic-test",
        "title": "Live Trending Topic",
        "fallbackTitle": "Live Trending Topic",
        "url": "https://news.example.com/trending",
        "publishedAt": "2026-11-23",
        "curatedAt": "2026-11-23",
        "biasScore": {"bias_score": 50, "explanation": "Test", "bias_category": "News"},
        "analysisResult": {
            "cleaned_text": "Sample",
            "sentiment": "Neutral",
            "score": 85,
            "facts": [],
            "perspective": "Counter point",
        },
    }

    monkeypatch.setattr(routes, "fetch_rss_stories", lambda: [{"title": "Sample"}])
    monkeypatch.setattr(routes, "evaluate_and_generate_topics", lambda stories: [sample_topic])

    res = client.get("/api/trending")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert len(data["topics"]) == 1
    assert data["topics"][0]["id"] == "dynamic-test"

    # Case 2: Subsequent hit serves from cache
    res2 = client.get("/api/trending")
    assert res2.status_code == 200
    assert len(res2.json()["topics"]) == 1

    trending_cache.clear()

