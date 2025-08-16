import trafilatura
from newspaper import Article
from bs4 import BeautifulSoup
from readability import Document
import requests
import logging
import json

# This class contains extractors that are more and more advanced from top to
# bottom and they will try to extract any article.


class Article_extractor:
    def __init__(self, url):
        self.url = url
        self.headers = {
            "User-Agent": (
                "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
                " AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/113.0 Safari/537.36"
            )
        }

    def _fetch_html(self):
        try:
            res = requests.get(self.url, self.headers, timeout=10)
            res.raise_for_status()
            return res.text
        except requests.RequestException as e:
            logging.error(f"failed to fetch: {self.url}-{e}")
            return ""

    def extract_with_trafilatura(self):
        downloaded = trafilatura.fetch_url(self.url)
        if not downloaded:
            return {}
        result = trafilatura.extract(
            downloaded,
            no_fallback=True,
            include_comments=False,
            include_tables=False,
            favor_recall=True,
            output_format="json",
        )
        if result:
            return json.loads(result)
        return {}

    def extract_with_newspaper(self) -> dict:
        try:
            article = Article(self.url)
            article.download()
            article.parse()
            return {
                "title": article.title,
                "text": article.text,
                "authors": article.authors,
                "publish_date": (
                    article.publish_date.isoformat() if article.publish_date else None
                ),
            }
        except Exception as e:
            logging.error(f"Newspaper3k failed: {e}")
            return {}

    def extract_with_bs4(self) -> dict:
        html = self._fetch_html()
        if not html:
            return {}

        try:
            doc = Document(html)
            soup = BeautifulSoup(doc.summary(), "html.parser")
            title = doc.title()
            text = soup.get_text(separator="\n")
            return {"title": title, "text": text}
        except Exception as e:
            logging.error(f"BS4 + Readability fallback failed: {e}")
            return {}

    def extract(self):
        methods = [
            self.extract_with_trafilatura,
            self.extract_with_newspaper,
            self.extract_with_bs4,
        ]
        for method in methods:
            result = method()
            if result and result.get("text"):
                result["url"] = self.url
                return result
        return {"url": self.url, "text": "", "error": "Failed to extract article."}
