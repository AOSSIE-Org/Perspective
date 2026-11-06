"""Tests for the scraper stage: article extraction fallbacks, text cleaning and keyword extraction."""

import datetime
import sys
import types

import nltk
import pytest
import rake_nltk
import requests

from app.config import MAX_KEYWORDS, MIN_LINE_CHARS, SCRAPER_USER_AGENT
from app.modules.scraper import extractor as extractor_module
from app.modules.scraper import keywords as keywords_module
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.keywords import DEFAULT_STOPWORDS, extract_keyword_data, extract_keywords
from app.modules.scraper.safe_fetch import UnsafeURLError

URL = "https://news.example.com/bridge"
PARAGRAPHS = [f"Paragraph {i} about the new bridge that opened to traffic after two years of work." for i in range(6)]
HTML = (
    "<html><head><title>Bridge opens</title></head><body><article><h1>Bridge opens</h1>"
    + "".join(f"<p>{p}</p>" for p in PARAGRAPHS)
    + "</article></body></html>"
)
FAILED = {"url": URL, "text": "", "error": "Failed to extract article."}


# --- clean_extracted_text ---------------------------------------------------------


@pytest.mark.parametrize("empty", ["", None])
def test_cleaning_empty_input_returns_an_empty_string(empty):
    assert clean_extracted_text(empty) == ""


def test_cleaning_drops_boilerplate_and_short_lines_and_keeps_paragraphs():
    raw = (
        "Bridge opens\n"
        "  The new bridge opened to traffic on Monday morning.  \n"
        "\n\n\n"
        "Subscribe to our newsletter for daily updates\n"
        "© 2024 Example News Corporation, a long copyright line\n"
        "Officials expect ten thousand cars to cross it daily.\n"
        "READ MORE AT example.com/more-bridges-and-tunnels\n"
    )

    assert clean_extracted_text(raw) == (
        "The new bridge opened to traffic on Monday morning.\n\n"
        "Officials expect ten thousand cars to cross it daily."
    )


def test_cleaning_removes_inline_boilerplate_and_collapses_the_gap_it_leaves():
    raw = "The council met on Tuesday. Advertisement The budget vote passed."

    assert clean_extracted_text(raw) == "The council met on Tuesday. The budget vote passed."


def test_cleaning_keeps_only_lines_longer_than_the_minimum():
    at_limit = "x" * MIN_LINE_CHARS
    over_limit = "y" * (MIN_LINE_CHARS + 1)

    assert clean_extracted_text(f"{at_limit}\n{over_limit}") == over_limit


def test_cleaning_keeps_sentences_that_contain_boilerplate_words():
    text = (
        "An engine powered by hydrogen could drive a car for five hundred kilometres.\n"
        "Readers asked about using the new tool in newsrooms around the world.\n"
        "The photo by the river showed how far the water had risen overnight.\n"
        "Officials said the advertisement campaign would run until the end of May.\n"
        "About using the app offline, the team said support is still being planned.\n"
        "Read more atomic physics books if you want to understand the subject.\n"
        "Advertisement spending increased across the country last year.\n"
        "The firm cut its costs again. Advertisement revenue fell by a third.\n"
        "Privacy Policy Changes Will Affect Millions Of Residents\n"
        "Terms of Service Updates are due next week for most local residents.\n"
        "The firm cut its costs again. Privacy Policy Changes Will Affect Millions Of Residents.\n"
        "The firm cut its costs again. Privacy Policy Changes are coming for most local residents.\n"
        "The firm cut its costs again. Terms of Service Updates are due next week for most residents."
    )

    assert clean_extracted_text(text) == text.replace("\n", "\n\n")


def test_cleaning_drops_lines_made_of_boilerplate_markers():
    text = (
        "The council approved the new budget after a long debate on Tuesday.\n"
        "Read more at example.com about the city council and its members\n"
        "Sign up for our newsletter to get the latest stories every morning\n"
        "© 2026 Example News Network, a part of Example Media Group\n"
        " Read more at example.com for more information about the budget\n"
        "Privacy Policy | Terms of Service | Contact Us | About Us\n"
        "Advertisement | Report this ad | Sponsored content\r\n"
        "Residents will see the changes in their bills starting next month."
    )

    assert clean_extracted_text(text) == (
        "The council approved the new budget after a long debate on Tuesday.\n\n"
        "Residents will see the changes in their bills starting next month."
    )


def test_cleaner_downloads_nltk_data_only_when_it_is_missing(monkeypatch, fresh_module):
    downloads = []
    monkeypatch.setattr(nltk, "download", downloads.append)

    monkeypatch.setattr(nltk.data, "find", lambda resource: resource)
    fresh_module("app.modules.scraper.cleaner")
    assert downloads == []

    def missing(resource):
        raise LookupError(resource)

    monkeypatch.setattr(nltk.data, "find", missing)
    fresh_module("app.modules.scraper.cleaner")
    assert downloads == ["stopwords", "punkt_tab"]


# --- extract_keywords ---------------------------------------------------------------


@pytest.fixture
def default_stopwords(monkeypatch):
    # Whether NLTK's stopword corpus is installed differs between machines.
    monkeypatch.setattr(keywords_module, "STOPWORDS_SET", DEFAULT_STOPWORDS)


def fake_rake(phrases_with_scores=None, error=None):
    created = []

    class FakeRake:
        def __init__(self, stopwords):
            created.append(stopwords)
            self.text = None

        def extract_keywords_from_text(self, text):
            if error:
                raise error
            self.text = text

        def get_ranked_phrases_with_scores(self):
            return list(phrases_with_scores or [])

    return FakeRake, created


@pytest.mark.parametrize("blank", ["", "   \n\t"])
def test_blank_text_has_no_keywords(monkeypatch, blank):
    rake, created = fake_rake([(1.0, "never used")])
    monkeypatch.setattr(rake_nltk, "Rake", rake)

    assert extract_keywords(blank) == []
    assert created == []


def test_rake_phrases_are_returned_highest_score_first(monkeypatch, default_stopwords):
    rake, created = fake_rake([(1.5, "low phrase"), (9.0, "top phrase"), (4.0, "middle phrase")])
    monkeypatch.setattr(rake_nltk, "Rake", rake)

    assert extract_keywords("Some article text.") == ["top phrase", "middle phrase", "low phrase"]
    assert created == [DEFAULT_STOPWORDS]


def test_rake_phrases_are_capped_at_max_keywords(monkeypatch, default_stopwords):
    rake, _ = fake_rake([(float(i), f"phrase {i}") for i in range(MAX_KEYWORDS + 5)])
    monkeypatch.setattr(rake_nltk, "Rake", rake)

    result = extract_keywords("Some article text.")

    assert len(result) == MAX_KEYWORDS
    assert result[0] == f"phrase {MAX_KEYWORDS + 4}"
    assert extract_keywords("Some article text.", max_keywords=2) == [f"phrase {MAX_KEYWORDS + 4}", f"phrase {MAX_KEYWORDS + 3}"]


FALLBACK_TEXT = "Officials said the budget, the BUDGET and the bridge were approved (finally)."
FALLBACK_KEYWORDS = ["officials", "said", "budget", "bridge", "approved", "finally"]


@pytest.mark.parametrize(
    "rake_behaviour",
    [{"error": LookupError("punkt_tab not found")}, {"phrases_with_scores": []}],
    ids=["rake-fails", "rake-finds-nothing"],
)
def test_falls_back_to_unique_content_words(monkeypatch, default_stopwords, rake_behaviour):
    rake, _ = fake_rake(**rake_behaviour)
    monkeypatch.setattr(rake_nltk, "Rake", rake)

    assert extract_keywords(FALLBACK_TEXT) == FALLBACK_KEYWORDS
    assert extract_keywords(FALLBACK_TEXT, max_keywords=3) == FALLBACK_KEYWORDS[:3]


def test_keyword_data_summarises_the_keywords(monkeypatch, default_stopwords):
    rake, _ = fake_rake([(2.0, "second"), (5.0, "first")])
    monkeypatch.setattr(rake_nltk, "Rake", rake)

    assert extract_keyword_data("Some article text.") == {"keywords": ["first", "second"], "top_phrase": "first", "count": 2}
    assert extract_keyword_data("") == {"keywords": [], "top_phrase": None, "count": 0}


def test_stopwords_come_from_nltk_when_its_corpus_is_available(monkeypatch, fresh_module):
    corpus = types.SimpleNamespace(words=lambda language: ["alpha", "beta"])
    monkeypatch.setattr(nltk.corpus, "stopwords", corpus)

    assert fresh_module("app.modules.scraper.keywords").STOPWORDS_SET == {"alpha", "beta"}


def test_stopwords_fall_back_to_the_built_in_list_when_the_corpus_is_missing(monkeypatch, fresh_module):
    def missing(language):
        raise LookupError("stopwords not found")

    monkeypatch.setattr(nltk.corpus, "stopwords", types.SimpleNamespace(words=missing))

    assert fresh_module("app.modules.scraper.keywords").STOPWORDS_SET == DEFAULT_STOPWORDS


def test_stopwords_fall_back_to_the_built_in_list_when_nltk_cannot_be_imported(monkeypatch, fresh_module):
    monkeypatch.setitem(sys.modules, "nltk", None)

    assert fresh_module("app.modules.scraper.keywords").STOPWORDS_SET == DEFAULT_STOPWORDS


# --- Article_extractor ----------------------------------------------------------------


@pytest.fixture
def fetched(monkeypatch):
    """Serve HTML to the extractor without a network; `pages` holds what each fetch returns."""
    calls = []
    pages = {"result": HTML}

    def fake_fetch(url, headers):
        calls.append((url, headers))
        if isinstance(pages["result"], Exception):
            raise pages["result"]
        return pages["result"]

    monkeypatch.setattr(extractor_module, "fetch_public_html", fake_fetch)
    return pages, calls


def no_trafilatura(monkeypatch):
    monkeypatch.setattr(extractor_module.trafilatura, "extract", lambda *args, **kwargs: None)


def broken(*args, **kwargs):
    raise RuntimeError("parser crashed")


def test_trafilatura_extracts_the_article_text(fetched):
    _, calls = fetched

    result = Article_extractor(URL).extract()

    assert result["url"] == URL
    for paragraph in PARAGRAPHS:
        assert paragraph in result["text"]
    assert calls == [(URL, {"User-Agent": SCRAPER_USER_AGENT})]


def test_falls_back_to_newspaper_when_trafilatura_finds_nothing(monkeypatch, fetched):
    _, calls = fetched
    no_trafilatura(monkeypatch)

    result = Article_extractor(URL).extract()

    assert result["title"] == "Bridge opens"
    assert PARAGRAPHS[0] in result["text"]
    assert result["publish_date"] is None
    assert result["url"] == URL
    # The page is fetched once and shared by every extractor.
    assert len(calls) == 1


def test_newspaper_publish_dates_are_iso_formatted(monkeypatch, fetched):
    class DatedArticle:
        def __init__(self, url, fetch_images):
            assert fetch_images is False
            self.received = None

        def download(self, input_html):
            self.received = input_html

        def parse(self):
            self.title = "Dated"
            self.text = "Body text." if self.received == HTML else ""
            self.authors = ["A. Writer"]
            self.publish_date = datetime.datetime(2025, 3, 14, 9, 30)

    monkeypatch.setattr(extractor_module, "Article", DatedArticle)

    assert Article_extractor(URL).extract_with_newspaper() == {
        "title": "Dated",
        "text": "Body text.",
        "authors": ["A. Writer"],
        "publish_date": "2025-03-14T09:30:00",
    }


def test_falls_back_to_readability_when_newspaper_fails(monkeypatch, fetched):
    no_trafilatura(monkeypatch)
    monkeypatch.setattr(extractor_module, "Article", broken)

    result = Article_extractor(URL).extract()

    assert result["title"] == "Bridge opens"
    assert PARAGRAPHS[-1] in result["text"]
    assert result["url"] == URL
    assert "authors" not in result


def test_reports_failure_when_every_extractor_fails(monkeypatch, fetched):
    no_trafilatura(monkeypatch)
    monkeypatch.setattr(extractor_module, "Article", broken)
    monkeypatch.setattr(extractor_module, "Document", broken)

    assert Article_extractor(URL).extract() == FAILED


def test_an_extraction_without_text_counts_as_a_failure(monkeypatch, fetched):
    pages, _ = fetched
    pages["result"] = "<html><body><nav>Home</nav></body></html>"
    monkeypatch.setattr(extractor_module.trafilatura, "extract", lambda *args, **kwargs: '{"title": "Home", "text": ""}')
    monkeypatch.setattr(extractor_module, "Article", broken)
    monkeypatch.setattr(extractor_module, "Document", broken)

    assert Article_extractor(URL).extract() == FAILED


@pytest.mark.parametrize(
    "error",
    [UnsafeURLError("The URL points to a private or reserved address."), requests.ConnectionError("refused")],
)
def test_a_page_that_cannot_be_fetched_is_reported_once_without_parsing(monkeypatch, fetched, error):
    pages, calls = fetched
    pages["result"] = error
    monkeypatch.setattr(extractor_module.trafilatura, "extract", broken)
    monkeypatch.setattr(extractor_module, "Article", broken)
    monkeypatch.setattr(extractor_module, "Document", broken)

    assert Article_extractor(URL).extract() == FAILED
    assert len(calls) == 1
