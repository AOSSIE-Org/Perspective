"""
sentiment.py
------------
Performs sentiment + tone analysis on cleaned article text.

Upgraded from a single-word "Positive/Negative/Neutral" response to a
richer structured output that includes:
    - sentiment:  Positive | Negative | Neutral
    - tone:       detailed tone descriptor (alarmist, hopeful, critical, etc.)
    - intensity:  Low | Medium | High — how strongly the sentiment is expressed

This eliminates the need for a separate tone call in extract_metadata
when this node has already run.
"""

import os
import json
import re
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SENTIMENT_PROMPT = """Analyze the emotional tone and sentiment of the following article excerpt.

Return ONLY this JSON (no code fences, no extra text):
{{
  "sentiment": "Positive" | "Negative" | "Neutral",
  "tone": one of [alarmist, optimistic, critical, neutral, celebratory, authoritative, speculative, analytical, urgent, hopeful],
  "intensity": "Low" | "Medium" | "High"
}}

Article excerpt:
{text}
"""


def run_sentiment_sdk(state: dict) -> dict:
    text = state.get("cleaned_text", "")
    if not text:
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": "Empty text",
        }

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "Return only valid JSON. No markdown."},
                {"role": "user", "content": SENTIMENT_PROMPT.format(text=text[:3000])},
            ],
            temperature=0.1,
            max_tokens=80,
        )
        raw = response.choices[0].message.content.strip()
        # Strip any accidental fences
        raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.IGNORECASE).strip()
        parsed = json.loads(raw)

        sentiment_val = parsed.get("sentiment", "Neutral").lower()
        tone_val = parsed.get("tone", "neutral")
        intensity_val = parsed.get("intensity", "Medium")

        logger.info(
            f"Sentiment: {sentiment_val} | Tone: {tone_val} | Intensity: {intensity_val}"
        )
        return {
            **state,
            "sentiment": sentiment_val,
            "tone": tone_val,
            "intensity": intensity_val,
            "status": "success",
        }

    except (json.JSONDecodeError, Exception) as e:
        # Graceful fallback — don't crash the whole pipeline for sentiment
        logger.warning(f"Sentiment parse error: {e}. Defaulting to neutral.")
        return {
            **state,
            "sentiment": "neutral",
            "tone": "neutral",
            "intensity": "Medium",
            "status": "success",
        }
