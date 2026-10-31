"""
cleaner.py
----------
Utility for cleaning raw extracted article text by removing boilerplate,
junk lines, and excessive whitespace. Helps prepare text for downstream
processing like NLP, fact-checking, and embedding.

Main Features:
    - Normalizes line breaks.
    - Removes common boilerplate phrases and copyright notices.
    - Filters out lines that are too short to be meaningful.
    - Tidies spacing and formatting for readability.

Functions:
    clean_extracted_text(text: str) -> str
        Cleans up extracted text by removing repetitive, promotional, or
        irrelevant content while preserving main article body.
"""

import re
import nltk

try:
    nltk.data.find("corpora/stopwords")
    nltk.data.find("corpora/punkt_tab")

except LookupError:
    nltk.download("stopwords")
    nltk.download("punkt_tab")


def clean_extracted_text(text: str):
    """
    Clean up the extracted article text to remove boilerplate,
    repetitive lines, excessive whitespace, and unwanted junk.
    """
    if not text:
        return ""

    # 1. Removing multiple line breaks to single line break
    text = re.sub(r"\n{2,}", "\n\n", text)

    # 2. Removing common boilerplate patterns
    # (example: "Read more at...", "Subscribe", etc.)
    boilerplate_phrases = [
        r"read more at.*",
        r"subscribe to.*",
        r"click here to.*",
        r"follow us on.*",
        r"advertisement",
        r"sponsored content",
        r"promoted by.*",
        r"recommended for you",
        r"© \d{4}.*",  # copyright lines
        r"all rights reserved",
        r"terms of service",
        r"privacy policy",
        r"cookie policy",
        r"about us",
        r"contact us",
        r"share this article",
        r"sign up for our newsletter.*",
        r"report this ad",
        r"this story was originally published.*",
        r"originally appeared on.*",
        r"download our app.*",
        r"view comments",
        r"comment below",
        r"leave a comment",
        r"next article",
        r"previous article",
        r"related articles",
        r"top stories",
        r"breaking news",
        r"editor's picks",
        r"latest news",
        r"trending now",
        r"this content is provided by.*",
        r"image source:.*",
        r"photo by.*",
        r"disclaimer:.*",
        r"support independent journalism.*",
        r"if you enjoyed this article.*",
        r"don’t miss out on.*",
        r"watch the video",
        r"listen to the podcast",
        r"stay connected with.*",
        r"visit our homepage.*",
        r"post a job on.*",
        r"powered by .*",
    ]
    # Only drop whole boilerplate lines. Matching the phrases anywhere also cut
    # them out of article sentences (for example "an engine powered by
    # hydrogen ..."). A phrase ending in ".*" marks a line that starts with it,
    # like "Read more at ...". Other phrases, like "advertisement", only match
    # a line made of such markers alone, like "Advertisement" or
    # "Privacy Policy | Terms of Service", so a sentence that starts with one
    # of them is kept.
    # Spaces and tabs, including non-breaking spaces, but not line breaks.
    space = r"[^\S\r\n]*"
    flags = re.IGNORECASE | re.MULTILINE

    markers = [p for p in boilerplate_phrases if not p.endswith(".*")]
    marker = r"(?:" + "|".join(markers) + r")"
    separator = space + r"[|/,\u00b7\u2022-]" + space
    text = re.sub(
        r"^" + space + marker + r"(?:" + separator + marker + r")*" + space + r"[.!:]?" + space + r"$",
        "",
        text,
        flags=flags,
    )

    for pattern in boilerplate_phrases:
        if not pattern.endswith(".*"):
            continue
        phrase = pattern.removesuffix(".*")
        # Without a boundary after the phrase, "read more at" would also
        # match "Read more atomic ...".
        boundary = r"\b" if phrase[-1:].isalnum() else ""
        text = re.sub(r"^" + space + r"(?:" + phrase + ")" + boundary + r".*$", "", text, flags=flags)

    # 3. Remove lines with too few characters (likely junk)
    lines = text.split("\n")
    cleaned_lines = [line.strip() for line in lines if len(line.strip()) > 30]

    # 4. Join lines back with a double newline for paragraphs
    cleaned_text = "\n\n".join(cleaned_lines)

    # 5. Optional: Fix multiple spaces and trim
    cleaned_text = re.sub(r"[ \t]{2,}", " ", cleaned_text).strip()

    return cleaned_text
