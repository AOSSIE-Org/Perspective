"""
test_utils.py
-------------
Unit tests for:
  - app.utils.generate_chunk_id
  - app.modules.vector_store.chunk_rag_data
  - app.modules.facts_check.web_search
"""

import pytest
from unittest.mock import MagicMock, patch


# ---------------------------------------------------------------------------
# generate_chunk_id
# ---------------------------------------------------------------------------

from app.utils.generate_chunk_id import generate_id


class TestGenerateId:
    def test_returns_string_with_article_prefix(self):
        result = generate_id("Some article text here.")
        assert result.startswith("article-")

    def test_deterministic_for_same_input(self):
        text = "Climate change is accelerating."
        assert generate_id(text) == generate_id(text)

    def test_different_inputs_produce_different_ids(self):
        assert generate_id("Text A") != generate_id("Text B")

    def test_hash_portion_is_15_chars(self):
        result = generate_id("Some text")
        # format: "article-{15 chars}"
        assert len(result) == len("article-") + 15

    def test_raises_on_empty_string(self):
        with pytest.raises(ValueError):
            generate_id("")

    def test_raises_on_non_string(self):
        with pytest.raises((ValueError, AttributeError)):
            generate_id(None)


# ---------------------------------------------------------------------------
# chunk_rag_data
# ---------------------------------------------------------------------------

from app.modules.vector_store.chunk_rag_data import chunk_rag_data


def _make_perspective(perspective_text="Counter view.", reasoning="Step 1."):
    p = MagicMock()
    p.perspective = perspective_text
    p.reasoning = reasoning
    # Simulate pydantic .dict() method
    p.dict.return_value = {"perspective": perspective_text, "reasoning": reasoning}
    return p


def _valid_data():
    return {
        "cleaned_text": "Ice sheets are melting due to climate change and rising emissions.",
        "perspective": _make_perspective(),
        "facts": [
            {
                "original_claim": "Ice sheets are melting.",
                "verdict": "True",
                "explanation": "Supported by NASA data.",
                "source_link": "https://nasa.gov/study",
            }
        ],
    }


class TestChunkRagData:
    def test_returns_list_of_chunks(self):
        result = chunk_rag_data(_valid_data())
        assert isinstance(result, list)
        assert len(result) >= 1

    def test_perspective_chunk_is_present(self):
        result = chunk_rag_data(_valid_data())
        types = [c["metadata"]["type"] for c in result]
        assert "counter-perspective" in types

    def test_fact_chunks_are_present(self):
        result = chunk_rag_data(_valid_data())
        types = [c["metadata"]["type"] for c in result]
        assert "fact" in types

    def test_chunk_count_equals_1_perspective_plus_n_facts(self):
        data = _valid_data()
        data["facts"] = [
            {
                "original_claim": f"Claim {i}",
                "verdict": "True",
                "explanation": "Explanation.",
                "source_link": "https://example.com",
            }
            for i in range(3)
        ]
        result = chunk_rag_data(data)
        assert len(result) == 4  # 1 perspective + 3 facts

    def test_each_chunk_has_id_text_metadata(self):
        result = chunk_rag_data(_valid_data())
        for chunk in result:
            assert "id" in chunk
            assert "text" in chunk
            assert "metadata" in chunk

    def test_raises_on_missing_required_field(self):
        data = _valid_data()
        del data["perspective"]
        with pytest.raises((ValueError, KeyError, Exception)):
            chunk_rag_data(data)

    def test_raises_on_facts_not_a_list(self):
        data = _valid_data()
        data["facts"] = "not a list"
        with pytest.raises((ValueError, Exception)):
            chunk_rag_data(data)

    def test_raises_on_missing_fact_field(self):
        data = _valid_data()
        data["facts"] = [{"original_claim": "claim"}]  # missing verdict, explanation, source_link
        with pytest.raises((ValueError, KeyError, Exception)):
            chunk_rag_data(data)


# ---------------------------------------------------------------------------
# web_search — mock requests and DDGS
# ---------------------------------------------------------------------------

import app.modules.facts_check.web_search as ws_module
from app.modules.facts_check.web_search import search_google


class TestSearchGoogle:
    def test_returns_google_result_when_key_configured(self, mocker):
        mocker.patch.object(ws_module, "GOOGLE_SEARCH", "fake_key")
        mock_resp = MagicMock()
        mock_resp.json.return_value = {
            "items": [
                {
                    "title": "NASA Study",
                    "link": "https://nasa.gov",
                    "snippet": "Ice is melting.",
                }
            ]
        }
        mocker.patch("requests.get", return_value=mock_resp)

        result = search_google("ice sheet melting")
        assert len(result) == 1
        assert result[0]["title"] == "NASA Study"
        assert result[0]["link"] == "https://nasa.gov"

    def test_falls_back_to_ddg_when_google_key_absent(self, mocker):
        mocker.patch.object(ws_module, "GOOGLE_SEARCH", None)
        mock_ddgs = MagicMock()
        mock_ddgs.text.return_value = [
            {"title": "DDG Result", "href": "https://ddg.com", "body": "Some snippet."}
        ]
        mocker.patch("app.modules.facts_check.web_search.DDGS", return_value=mock_ddgs)

        result = search_google("ice sheet melting")
        assert len(result) == 1
        assert result[0]["title"] == "DDG Result"

    def test_returns_empty_list_when_both_providers_fail(self, mocker):
        mocker.patch.object(ws_module, "GOOGLE_SEARCH", None)
        mock_ddgs = MagicMock()
        mock_ddgs.text.side_effect = Exception("DDG down")
        mocker.patch("app.modules.facts_check.web_search.DDGS", return_value=mock_ddgs)

        result = search_google("some query")
        assert result == []

    def test_falls_back_to_ddg_when_google_returns_no_items(self, mocker):
        mocker.patch.object(ws_module, "GOOGLE_SEARCH", "fake_key")
        mock_resp = MagicMock()
        mock_resp.json.return_value = {}  # no "items" key
        mocker.patch("requests.get", return_value=mock_resp)

        mock_ddgs = MagicMock()
        mock_ddgs.text.return_value = [
            {"title": "DDG Fallback", "href": "https://ddg.com", "body": "snippet"}
        ]
        mocker.patch("app.modules.facts_check.web_search.DDGS", return_value=mock_ddgs)

        result = search_google("query")
        assert result[0]["title"] == "DDG Fallback"
