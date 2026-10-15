"""
test_scraper.py
---------------
Unit tests for scraper/cleaner.py, scraper/keywords.py, and
scraper/extractor.py (Article_extractor).

The extractor makes real HTTP/network calls in all three methods.
Those are mocked at the requests/trafilatura/newspaper boundary so
no live network traffic occurs.
"""

import sys
import pytest


# ---------------------------------------------------------------------------
# cleaner tests — no external deps, import directly
# ---------------------------------------------------------------------------

from app.modules.scraper.cleaner import clean_extracted_text


class TestCleanExtractedText:
    def test_empty_string_returns_empty(self):
        assert clean_extracted_text("") == ""

    def test_none_returns_empty(self):
        assert clean_extracted_text(None) == ""

    def test_removes_boilerplate_subscribe(self):
        text = "This is a real paragraph with enough characters to survive.\nSubscribe to our newsletter for updates."
        result = clean_extracted_text(text)
        assert "subscribe" not in result.lower()

    def test_removes_copyright_line(self):
        text = "Important article content that is long enough to keep.\n© 2025 News Corp. All rights reserved."
        result = clean_extracted_text(text)
        assert "© 2025" not in result

    def test_removes_short_lines(self):
        # Lines shorter than 30 chars should be filtered
        text = "Short line\nThis is a sufficiently long line that should survive the filter."
        result = clean_extracted_text(text)
        assert "Short line" not in result
        assert "sufficiently long line" in result

    def test_collapses_multiple_blank_lines(self):
        text = "First paragraph with enough content here.\n\n\n\nSecond paragraph with enough content here."
        result = clean_extracted_text(text)
        assert "\n\n\n" not in result

    def test_preserves_article_content(self):
        text = (
            "Scientists confirmed that global ice sheets are melting at an unprecedented rate "
            "driven by rising greenhouse gas emissions from human industrial activity."
        )
        result = clean_extracted_text(text)
        assert "ice sheets" in result
        assert "greenhouse gas" in result


# ---------------------------------------------------------------------------
# keywords tests
# ---------------------------------------------------------------------------

from app.modules.scraper.keywords import extract_keywords, extract_keyword_data


class TestExtractKeywords:
    def test_returns_list(self):
        result = extract_keywords("Climate change is accelerating global ice melt significantly.")
        assert isinstance(result, list)

    def test_empty_text_returns_empty_list(self):
        assert extract_keywords("") == []

    def test_whitespace_only_returns_empty_list(self):
        assert extract_keywords("   ") == []

    def test_respects_max_keywords(self):
        long_text = " ".join([f"keyword{i} topic{i} subject{i}" for i in range(50)])
        result = extract_keywords(long_text, max_keywords=5)
        assert len(result) <= 5

    def test_default_max_is_15(self):
        long_text = " ".join([f"keyword{i} topic{i} subject{i}" for i in range(100)])
        result = extract_keywords(long_text)
        assert len(result) <= 15


class TestExtractKeywordData:
    def test_returns_dict_with_required_keys(self):
        result = extract_keyword_data("Climate change is accelerating global ice melt.")
        assert "keywords" in result
        assert "top_phrase" in result
        assert "count" in result

    def test_count_matches_keywords_length(self):
        result = extract_keyword_data("Climate change is accelerating global ice melt.")
        assert result["count"] == len(result["keywords"])

    def test_top_phrase_is_first_keyword(self):
        result = extract_keyword_data("Climate change is accelerating global ice melt.")
        if result["keywords"]:
            assert result["top_phrase"] == result["keywords"][0]

    def test_empty_text_top_phrase_is_none(self):
        result = extract_keyword_data("")
        assert result["top_phrase"] is None
        assert result["count"] == 0


# ---------------------------------------------------------------------------
# extractor tests — mock all network calls
# ---------------------------------------------------------------------------

from app.modules.scraper.extractor import Article_extractor


class TestArticleExtractor:
    def test_extract_falls_back_to_bs4_when_trafilatura_and_newspaper_fail(self, mocker):
        mocker.patch("trafilatura.fetch_url", return_value=None)
        mocker.patch.object(
            Article_extractor,
            "extract_with_newspaper",
            return_value={},
        )
        mock_response = mocker.MagicMock()
        mock_response.text = (
            "<html><body><p>This is a sufficiently long article paragraph about climate change "
            "and its effects on global ice sheets and sea levels.</p></body></html>"
        )
        mock_response.raise_for_status = mocker.MagicMock()
        mocker.patch("requests.get", return_value=mock_response)

        extractor = Article_extractor("https://example.com/article")
        result = extractor.extract()

        assert result["url"] == "https://example.com/article"
        assert "error" not in result
        assert "climate change" in result.get("text", "")

    def test_extract_returns_error_dict_when_all_methods_fail(self, mocker):
        mocker.patch("trafilatura.fetch_url", return_value=None)
        mocker.patch.object(Article_extractor, "extract_with_newspaper", return_value={})
        mocker.patch.object(Article_extractor, "extract_with_bs4", return_value={})

        extractor = Article_extractor("https://example.com/broken")
        result = extractor.extract()

        assert result["url"] == "https://example.com/broken"
        assert result.get("text") == ""
        assert "error" in result

    def test_extract_uses_trafilatura_result_when_available(self, mocker):
        mocker.patch(
            "trafilatura.fetch_url",
            return_value="<html>fake downloaded html</html>",
        )
        mocker.patch(
            "trafilatura.extract",
            return_value='{"title": "Test Article", "text": "This is the article body text."}',
        )

        extractor = Article_extractor("https://example.com/article")
        result = extractor.extract()

        assert result.get("text") == "This is the article body text."
        assert result["url"] == "https://example.com/article"

    def test_fetch_html_returns_empty_on_request_exception(self, mocker):
        import requests
        mocker.patch("requests.get", side_effect=requests.RequestException("timeout"))

        extractor = Article_extractor("https://example.com/article")
        result = extractor._fetch_html()
        assert result == ""
