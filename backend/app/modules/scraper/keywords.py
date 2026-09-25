"""
keywords.py
-----------
Module for extracting key phrases from text using the RAKE
(Rapid Automatic Keyword Extraction) algorithm with robust NLTK stopwords handling.
"""

from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

# Standard fallback stopwords set to prevent Python 3.13 / NLTK LazyLoader AttributeError
DEFAULT_STOPWORDS = {
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "aren't",
    "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but", "by",
    "can't", "cannot", "could", "couldn't", "did", "didn't", "do", "does", "doesn't", "doing", "don't",
    "down", "during", "each", "few", "for", "from", "further", "had", "hadn't", "has", "hasn't", "have",
    "haven't", "having", "he", "he'd", "he'll", "he's", "her", "here", "here's", "hers", "herself", "him",
    "himself", "his", "how", "how's", "i", "i'd", "i'll", "i'm", "i've", "if", "in", "into", "is", "isn't",
    "it", "it's", "its", "itself", "let's", "me", "more", "most", "mustn't", "my", "myself", "no", "nor",
    "not", "of", "off", "on", "once", "only", "or", "other", "ought", "our", "ours", "ourselves", "out",
    "over", "own", "same", "shan't", "she", "she'd", "she'll", "she's", "should", "shouldn't", "so", "some",
    "such", "than", "that", "that's", "the", "their", "theirs", "them", "themselves", "then", "there",
    "there's", "these", "they", "they'd", "they'll", "they're", "they've", "this", "those", "through", "to",
    "too", "under", "until", "up", "very", "was", "wasn't", "we", "we'd", "we'll", "we're", "we've", "were",
    "weren't", "what", "what's", "when", "when's", "where", "where's", "which", "while", "who", "who's",
    "whom", "why", "why's", "with", "won't", "would", "wouldn't", "you", "you'd", "you'll", "you're",
    "you've", "your", "yours", "yourself", "yourselves"
}

try:
    import nltk
    from nltk.corpus import stopwords
    try:
        STOPWORDS_SET = set(stopwords.words("english"))
    except Exception:
        STOPWORDS_SET = DEFAULT_STOPWORDS
except Exception:
    STOPWORDS_SET = DEFAULT_STOPWORDS


def extract_keywords(text: str, max_keywords: int = 15) -> List[str]:
    """
    Extracts important keywords from the input text using RAKE algorithm.
    """
    if not text or not text.strip():
        return []

    try:
        from rake_nltk import Rake
        rake = Rake(stopwords=STOPWORDS_SET)
        rake.extract_keywords_from_text(text)
        keywords_with_scores = rake.get_ranked_phrases_with_scores()
        keywords = [phrase for score, phrase in sorted(keywords_with_scores, reverse=True)]
        if keywords:
            return keywords[:max_keywords]
    except Exception as e:
        logger.warning(f"RAKE keyword extraction fallback triggered: {e}")

    # Fallback keyword extraction: frequency-based content words
    words = [w.strip(".,!?;:()[]\"'").lower() for w in text.split()]
    filtered = [w for w in words if len(w) > 3 and w not in STOPWORDS_SET]
    unique_keywords = list(dict.fromkeys(filtered))
    return unique_keywords[:max_keywords]


def extract_keyword_data(text: str) -> Dict:
    keywords = extract_keywords(text)
    return {
        "keywords": keywords,
        "top_phrase": keywords[0] if keywords else None,
        "count": len(keywords),
    }
