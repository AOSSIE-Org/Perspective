"""
keywords.py
-----------
Module for extracting key phrases from text using the RAKE
(Rapid Automatic Keyword Extraction) algorithm. This utility
helps identify the most relevant and representative words or
phrases in a body of text, often useful for summarization,
tagging, search indexing, and content analysis.

Functions:
    extract_keywords(text: str, max_keywords: int = 15)
        Runs the RAKE algorithm on the provided text and returns
        the top-ranked keywords or phrases up to the specified limit.

    extract_keyword_data(text: str) -> Dict
        Higher-level helper function that packages extracted
        keywords along with the top phrase and the total count
        into a single dictionary for convenient downstream use.
"""


from rake_nltk import Rake
from typing import Dict


def extract_keywords(text: str, max_keywords: int = 15):
    """
    Extracts important keywords from the input text using RAKE algorithm.

    Args:
        text (str): The cleaned article text.
        max_keywords (int): Max number of keywords to return.

    Returns:
        List[str]: A list of important keywords/phrases.
    """
    rake = Rake()
    rake.extract_keywords_from_text(text)
    keywords_with_scores = rake.get_ranked_phrases_with_scores()

    # Sort and limit
    keywords = [phrase for score, phrase in sorted(keywords_with_scores, reverse=True)]
    return keywords[:max_keywords]


def extract_keyword_data(text: str) -> Dict:
    """
    High-level utility to package all keyword-related data.

    Returns:
        Dict: {
            "keywords": [...],
            "top_phrase": "...",
            "count": N
        }
    """
    keywords = extract_keywords(text)
    return {
        "keywords": keywords,
        "top_phrase": keywords[0] if keywords else None,
        "count": len(keywords),
    }
