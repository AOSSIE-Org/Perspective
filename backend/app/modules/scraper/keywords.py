import re
from collections import Counter

_STOP_WORDS = frozenset({
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "been",
    "be", "have", "has", "had", "do", "does", "did", "will", "would",
    "could", "should", "may", "might", "shall", "can", "need", "dare",
    "it", "its", "this", "that", "these", "those", "he", "she", "they",
    "we", "you", "me", "him", "her", "us", "them", "my", "your",
    "his", "our", "their", "not", "no", "nor", "if", "then", "than",
    "so", "such", "very", "too", "also", "just", "about", "above",
    "after", "again", "all", "any", "because", "before", "being",
    "below", "between", "both", "during", "each", "few", "further",
    "get", "got", "here", "how", "into", "more", "most", "much",
    "must", "new", "now", "off", "old", "once", "only", "other",
    "out", "over", "own", "per", "same", "some", "still", "there",
    "through", "under", "until", "upon", "what", "when", "where",
    "which", "while", "who", "whom", "why", "yet", "said", "like",
    "one", "two", "many", "way", "even", "back", "well", "also",
})


def extract_keywords(text: str, max_keywords: int = 15) -> list[str]:
    """Extract top keywords by frequency (no external NLP libraries)."""
    if not text:
        return []
    words = re.findall(r"\b[a-zA-Z]{3,}\b", text.lower())
    filtered = [w for w in words if w not in _STOP_WORDS]
    freq = Counter(filtered)
    return [word for word, _ in freq.most_common(max_keywords)]