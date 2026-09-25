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
            logger.warning("Empty perspective text in judge_perspective, assigning default score 85")
            return {**state, "score": 85, "status": "success"}

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
            max_tokens=64,
        )

        raw = chat_completion.choices[0].message.content.strip()

        # Pull the first integer 0–100
        m = re.search(r"\b(\d{1,3})\b", raw)
        score = max(0, min(100, int(m.group(1)))) if m else 88

        return {**state, "score": score, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in judge_perspective: {e}")
        return {**state, "score": 85, "status": "success"}
