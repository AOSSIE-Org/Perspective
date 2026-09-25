"""
judge.py
--------
Evaluates a generated counter-perspective using an LLM-based scoring system.
"""

import os
import re
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def judge_perspective(state):
    try:
        perspective_obj = state.get("perspective")
        text = getattr(perspective_obj, "perspective", str(perspective_obj or "")).strip()
        if not text:
            logger.warning("Empty perspective text in judge_perspective; returning low score to trigger retry")
            return {**state, "score": 0, "status": "success"}

        prompt = (
            "You are an expert perspective evaluator. Please rate the following counter-perspective "
            "on originality, reasoning quality, and factual grounding. "
            "Provide ONLY a single integer score from 0 (very poor) to 100 (excellent). Do not include any explanations.\n\n"
            f"=== Perspective to score ===\n{text}"
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "user", "content": prompt},
            ],
            model="openai/gpt-oss-20b",
            temperature=0.0,
            max_tokens=256,
        )

        raw = (chat_completion.choices[0].message.content or "").strip()

        # Pull the first integer 0–100; treat unparseable output as a low score to trigger retry
        m = re.search(r"\b(\d{1,3})\b", raw)
        if not m:
            logger.warning(f"judge_perspective: no score found in response {raw!r}; returning low score to trigger retry")
            return {**state, "score": 0, "status": "success"}

        score = max(0, min(100, int(m.group(1))))
        return {**state, "score": score, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in judge_perspective: {e}")
        return {**state, "status": "error", "error_from": "judge", "message": str(e)}
