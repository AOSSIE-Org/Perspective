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
    keywords = [phrase for score, phrase in sorted(
        keywords_with_scores,
        reverse=True
        )]
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
        "count": len(keywords)
    }
