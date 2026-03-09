"""
check_bias.py
-------------
Analyzes article bias using a structured multi-dimensional rubric.

Instead of returning a raw number, the LLM now scores FIVE specific
dimensions and returns a JSON breakdown, which is averaged to produce
the final score. This prevents hallucinated single-number outputs and
gives users actionable detail.

Dimensions scored (0–100 each):
    language_bias    – emotionally charged, loaded, or manipulative language
    source_balance   – diversity and fairness of sources cited
    framing_bias     – how the issue is framed (one-sided vs balanced)
    omission_bias    – important counter-arguments or facts left out
    confirmation_bias – cherry-picking data to confirm a prior position
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

BIAS_PROMPT = """You are an expert media literacy analyst. Analyze the following article for journalistic bias.

Score each dimension from 0 (none) to 100 (extreme):
- "language_bias": Use of emotionally charged, loaded, or manipulative language
- "source_balance": How diverse and balanced are the sources cited
- "framing_bias": Is the issue framed one-sidedly or with multiple perspectives
- "omission_bias": Are important counter-arguments or facts left out
- "confirmation_bias": Does the article cherry-pick data to confirm a pre-existing view

Also provide a one-sentence "summary" of the overall bias pattern.

Return ONLY valid JSON, no markdown, no extra text:
{{
  "language_bias": <0-100>,
  "source_balance": <0-100>,
  "framing_bias": <0-100>,
  "omission_bias": <0-100>,
  "confirmation_bias": <0-100>,
  "summary": "<one sentence>"
}}

Article:
{text}
"""


def check_bias(text: str) -> dict:
    if not text or not text.strip():
        logger.error("Missing or empty text for bias detection")
        return {
            "status": "error",
            "error_from": "bias_detection",
            "message": "Empty text",
        }

    # Use a focused excerpt for bias detection — first 6000 chars suffices
    excerpt = text[:6000]

    try:
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert media bias analyst. Return only valid JSON.",
                },
                {"role": "user", "content": BIAS_PROMPT.format(text=excerpt)},
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.1,  # very low — keep scoring deterministic
            max_tokens=300,
        )

        raw = response.choices[0].message.content.strip()

        # Strip markdown fences if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        raw = raw.strip()

        scores = json.loads(raw)

        # Calculate composite score as weighted average
        dimensions = [
            "language_bias",
            "source_balance",
            "framing_bias",
            "omission_bias",
            "confirmation_bias",
        ]
        valid_scores = [
            scores[d] for d in dimensions if isinstance(scores.get(d), (int, float))
        ]
        composite = round(sum(valid_scores) / len(valid_scores)) if valid_scores else 0

        logger.info(f"Bias analysis complete — composite score: {composite}")
        return {
            "bias_score": composite,
            "dimensions": {d: scores.get(d, 0) for d in dimensions},
            "summary": scores.get("summary", ""),
            "status": "success",
        }

    except json.JSONDecodeError as e:
        logger.warning(f"Bias JSON parse failed, falling back to raw parse: {e}")
        # Fallback: try to extract a number from raw output
        import re

        nums = re.findall(r"\b(\d{1,3})\b", raw)
        score = int(nums[0]) if nums else 50
        return {
            "bias_score": min(max(score, 0), 100),
            "status": "success",
            "summary": "",
        }

    except Exception as e:
        logger.exception("Error in bias detection")
        return {"status": "error", "error_from": "bias_detection", "message": str(e)}
