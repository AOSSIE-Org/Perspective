"""
judge.py
--------
Evaluates a generated counter-perspective using an LLM-based scoring system.

This module:
    - Uses Groq's LLM to rate the originality, reasoning quality,
      and factual grounding of a generated perspective.
    - Returns a score from 0 (very poor) to 100 (excellent).
    - Handles parsing errors and unexpected responses gracefully.

Functions:
    judge_perspective(state: dict) -> dict:
        Evaluates the given perspective and returns an integer score with status metadata.
"""


import re
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage
from app.logging.logging_config import setup_logger
from app.llm_config import LLM_MODEL

logger = setup_logger(__name__)

# Init once
groq_llm = ChatGroq(
    model=LLM_MODEL,
    temperature=0.0,
    max_tokens=10,
)


def judge_perspective(state):
    try:
        perspective_obj = state.get("perspective")
        text = getattr(perspective_obj, "perspective", "").strip()
        if not text:
            raise ValueError("Empty 'perspective' for scoring")

        prompt = f"""
You are an expert evaluator. Please rate the following counter-perspective
on originality, reasoning quality, and factual grounding. Provide ONLY
a single integer score from 0 (very poor) to 100 (excellent).

=== Perspective to score ===
{text}
"""

        response = groq_llm.invoke([HumanMessage(content=prompt)])

        if isinstance(response, list) and response:
            raw = response[0].content.strip()
        elif hasattr(response, "content"):
            raw = response.content.strip()
        else:
            raw = str(response).strip()

        # 5) Pull the first integer 0–100
        m = re.search(r"\b(\d{1,3})\b", raw)
        if not m:
            raise ValueError(f"Couldn’t parse a score from: '{raw}'")

        score = max(0, min(100, int(m.group(1))))

        return {**state, "score": score, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in judge_perspective: {e}")
        return {
            "status": "error",
            "error_from": "judge_perspective",
            "message": str(e),
        }
