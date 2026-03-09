"""
extract_metadata.py
-------------------
Extracts structured article metadata using Groq LLM (Llama 3.3 70B).

Improvements:
    - Retry logic: up to 2 attempts on JSON parse failure
    - More specific prompt with examples for each field
    - Robust JSON cleaning (strips fences, BOM, leading junk)
    - Type normalisation for entities and key_points

Returns a dict with:
    summary     - 2-3 sentence objective summary
    main_claim  - The central argument/thesis in one sentence
    entities    - Key named entities (people, orgs, places)
    tone        - One-word tone descriptor
    key_points  - 3-5 bullet-point insights
"""

import os
import json
import re
import time
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

load_dotenv()
logger = setup_logger(__name__)

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

_FALLBACK = {
    "summary": "",
    "main_claim": "",
    "entities": [],
    "tone": "neutral",
    "key_points": [],
}

METADATA_PROMPT = """Analyze the following article excerpt and return a JSON object. Be precise and factual.

Fields required:
- "summary": String. A 2-3 sentence objective summary of what the article is about.
- "main_claim": String. The single central argument or thesis in ONE sentence.
- "entities": Array of strings. Key named people, organisations, countries, or technologies mentioned.
- "tone": String. ONE word describing the overall tone. Choose from: alarmist, optimistic, critical, neutral, celebratory, authoritative, speculative, alarming, hopeful.
- "key_points": Array of strings. Exactly 3-5 concise insights or findings from the article.

Rules:
- Return ONLY the JSON object. No markdown code fences, no explanations, no extra text.
- If you cannot determine a field, use an empty string or empty array.

Article:
{text}
"""


def _clean_json_string(raw: str) -> str:
    """Remove common wrapping/junk around LLM JSON output."""
    raw = raw.strip().lstrip("\ufeff")  # strip BOM
    # Remove markdown fences
    raw = re.sub(r"^```(?:json)?\s*", "", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s*```$", "", raw)
    return raw.strip()


def extract_article_metadata(cleaned_text: str) -> dict:
    """
    Call Groq LLM to extract structured article metadata.
    Retries once on JSON parse failure.
    """
    if not cleaned_text or not cleaned_text.strip():
        return _FALLBACK.copy()

    # Use first 5000 chars — sufficient for metadata capture
    excerpt = cleaned_text[:5000]
    prompt = METADATA_PROMPT.format(text=excerpt)

    for attempt in range(1, 3):
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[
                    {
                        "role": "system",
                        "content": "You are a precise article analyst. Return only valid JSON.",
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.1,  # near-zero for consistent structured output
                max_tokens=500,
            )

            raw = response.choices[0].message.content
            cleaned = _clean_json_string(raw)
            metadata = json.loads(cleaned)

            # Normalise types
            if isinstance(metadata.get("entities"), str):
                metadata["entities"] = [
                    e.strip()
                    for e in re.split(r"[,;]", metadata["entities"])
                    if e.strip()
                ]
            if isinstance(metadata.get("key_points"), str):
                metadata["key_points"] = [metadata["key_points"]]
            if not isinstance(metadata.get("entities"), list):
                metadata["entities"] = []
            if not isinstance(metadata.get("key_points"), list):
                metadata["key_points"] = []

            logger.info("Article metadata extracted successfully.")
            return metadata

        except json.JSONDecodeError as e:
            logger.warning(
                f"Metadata JSON parse failed (attempt {attempt}): {e}. Raw: {raw[:200]}"
            )
            if attempt < 2:
                time.sleep(1)
                continue
            return _FALLBACK.copy()

        except Exception as e:
            logger.exception(f"Metadata extraction error: {e}")
            return _FALLBACK.copy()

    return _FALLBACK.copy()
