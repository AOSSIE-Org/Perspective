"""
cleaner.py
----------
High-quality text cleaning pipeline for extracted article content.

Major improvements over v1:
  - Single compiled regex pass replaces 40 sequential re.sub() calls (O(N) → O(1))
  - HTML entity decoding (handles &amp; &nbsp; &#8217; etc.)
  - Unicode normalisation (removes zero-width spaces, BOM, control chars)
  - Spam / gibberish detection with quality score gate
  - Repetition deduplication (removes near-duplicate consecutive sentences)
  - Content quality validation: returns empty string for unacceptable content
  - Minimum word / sentence count checks
"""

import re
import html
import unicodedata
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

# ── Compile the boilerplate pattern ONCE at module load ──────────────────────
_BOILERPLATE_PATTERNS = [
    r"read\s+more\s+at\s+\S+",
    r"subscribe\s+to\s+(?:our|the)?\s*\S+",
    r"click\s+here\s+to\s+\S+",
    r"follow\s+us\s+on\s+\S+",
    r"sign\s+up\s+for\s+(?:our|the)?\s*(?:newsletter|free)?\s*(?:newsletter)?",
    r"(?:©|copyright)\s*\d{4}[^\n]*",
    r"all\s+rights\s+reserved[^\n]*",
    r"terms\s+of\s+(?:service|use)[^\n]*",
    r"privacy\s+policy[^\n]*",
    r"cookie\s+(?:policy|settings)[^\n]*",
    r"(?:share|email)\s+this\s+article",
    r"report\s+this\s+ad",
    r"(?:view|leave\s+a?|post\s+a?)\s*comments?",
    r"(?:next|previous)\s+article",
    r"related\s+articles",
    r"(?:top|breaking|latest)\s+(?:stories|news)",
    r"editor(?:'s|s)?\s+picks",
    r"trending\s+now",
    r"(?:advertisement|sponsored\s+content|promoted\s+by\s+\S+)",
    r"(?:image|photo)\s+(?:source|by|credit)[^\n]*",
    r"disclaimer[:\s][^\n]*",
    r"support\s+independent\s+journalism[^\n]*",
    r"if\s+you\s+enjoyed\s+this\s+article[^\n]*",
    r"don'?t\s+miss\s+out\s+on[^\n]*",
    r"watch\s+the\s+video",
    r"listen\s+to\s+the\s+podcast",
    r"stay\s+connected\s+with[^\n]*",
    r"visit\s+our\s+homepage[^\n]*",
    r"powered\s+by\s+\S+",
    r"originally\s+(?:appeared|published)\s+(?:on|in)[^\n]*",
    r"download\s+our\s+app[^\n]*",
    r"this\s+(?:story|content)\s+was\s+originally\s+published[^\n]*",
    r"this\s+content\s+is\s+provided\s+by[^\n]*",
    r"get\s+the\s+(?:app|newsletter)[^\n]*",
    r"tap\s+here\s+(?:to|for)[^\n]*",
]

# Single combined pattern — one pass instead of 40
_COMBINED_BOILERPLATE = re.compile(
    "|".join(f"(?:{p})" for p in _BOILERPLATE_PATTERNS),
    flags=re.IGNORECASE | re.MULTILINE,
)

# Detect strings that look like HTML/code fragments
_HTML_TAG_PATTERN = re.compile(r"<[a-zA-Z/][^>]{0,100}>")
_CODE_BLOCK_PATTERN = re.compile(
    r"(?:function|const |var |import |#include|<\?php|\{\{)"
)
_URL_DENSE_PATTERN = re.compile(r"https?://\S+")

# Excessive punctuation / random-char gibberish
_GIBBERISH_PATTERN = re.compile(r"(.)\1{5,}")  # same char repeated 6+ times
_CAPS_RATIO_THRESH = 0.6  # >60% caps → likely spam/header spam

# Minimum thresholds for a viable article
_MIN_WORDS = 80
_MIN_LINES = 3


def _decode_html_entities(text: str) -> str:
    """Decode HTML entities like &amp; &nbsp; &#8217; → proper unicode."""
    return html.unescape(text)


def _normalize_unicode(text: str) -> str:
    """Remove zero-width spaces, BOM, and control characters; NFKC-normalize."""
    # NFKC collapses ligatures, full-width chars, etc.
    text = unicodedata.normalize("NFKC", text)
    # Strip control characters except tab and newline
    text = "".join(
        ch
        for ch in text
        if unicodedata.category(ch) not in ("Cc", "Cf") or ch in ("\t", "\n", "\r")
    )
    return text


def _score_line_quality(line: str) -> bool:
    """
    Return True if the line is likely real content, False if it looks like
    spam/junk/navigation/code.
    """
    stripped = line.strip()

    # Too short
    if len(stripped) < 30:
        return False

    # All-caps (likely a nav header or ad label)
    letters = [c for c in stripped if c.isalpha()]
    if (
        letters
        and sum(1 for c in letters if c.isupper()) / len(letters) > _CAPS_RATIO_THRESH
    ):
        return False

    # Dense URLs (link lists, share buttons)
    urls = _URL_DENSE_PATTERN.findall(stripped)
    if len(urls) > 2:
        return False

    # HTML/code fragments
    if _HTML_TAG_PATTERN.search(stripped) or _CODE_BLOCK_PATTERN.search(stripped):
        return False

    # Gibberish (aaaaaaa, !!!!!!!)
    if _GIBBERISH_PATTERN.search(stripped):
        return False

    return True


def _deduplicate_lines(lines: list[str]) -> list[str]:
    """
    Remove consecutive near-duplicate lines.
    Uses a sliding window of 2 — if a line is 80%+ similar to the previous, drop it.
    """
    if not lines:
        return lines

    def _similarity(a: str, b: str) -> float:
        a_words = set(a.lower().split())
        b_words = set(b.lower().split())
        if not a_words or not b_words:
            return 0.0
        return len(a_words & b_words) / max(len(a_words), len(b_words))

    deduped = [lines[0]]
    for line in lines[1:]:
        if _similarity(line, deduped[-1]) < 0.80:
            deduped.append(line)
    return deduped


def _is_article_quality(text: str) -> bool:
    """
    Global quality gate: reject the entire text if it doesn't meet
    minimum word and line counts. Catches paywall stubs, error pages,
    login prompts, and pure-navigation pages.
    """
    words = len(text.split())
    lines = [line for line in text.split("\n") if line.strip()]
    return words >= _MIN_WORDS and len(lines) >= _MIN_LINES


def clean_extracted_text(text: str) -> str:
    """
    Full cleaning pipeline:
      1. HTML entity decode
      2. Unicode normalisation
      3. Boilerplate removal (single compiled regex pass)
      4. Line-level quality filtering (spam, caps, HTML fragments, gibberish)
      5. Consecutive duplicate line removal
      6. Whitespace normalisation
      7. Global quality gate (reject stubs / error pages)

    Returns empty string if the content fails the quality gate.
    """
    if not text or not text.strip():
        return ""

    # 1. Decode HTML entities
    text = _decode_html_entities(text)

    # 2. Unicode normalisation
    text = _normalize_unicode(text)

    # 3. Remove boilerplate (single-pass compiled regex)
    text = _COMBINED_BOILERPLATE.sub("", text)

    # 4. Normalise line endings
    text = re.sub(r"\r\n|\r", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    # 5. Line-level quality filtering
    raw_lines = text.split("\n")
    good_lines = [line for line in raw_lines if _score_line_quality(line)]

    # 6. Deduplicate near-identical consecutive lines
    good_lines = _deduplicate_lines(good_lines)

    # 7. Reassemble
    cleaned = "\n\n".join(line.strip() for line in good_lines)

    # 8. Fix multi-space runs
    cleaned = re.sub(r"[ \t]{2,}", " ", cleaned).strip()

    # 9. Global quality gate
    if not _is_article_quality(cleaned):
        logger.warning(
            f"Content rejected by quality gate: {len(cleaned.split())} words, "
            f"{len([line for line in cleaned.split(chr(10)) if line.strip()])} lines"
        )
        return ""

    return cleaned
