"""
check_bias.py
-------------
Provides functionality to evaluate the bias score of an article using the Groq API.

This module:
    - Loads environment variables for Groq API credentials.
    - Connects to the Groq client.
    - Defines `check_bias()` to analyze a given article's bias and return a score.

Functions:
    check_bias(text: str) -> dict:
        Analyzes the input article text and returns a bias score between 0 and 100,
        where 0 indicates the least bias and 100 indicates the highest bias.

Environment Variables:
    GROQ_API_KEY (str): API key for authenticating with Groq.

Raises:
    ValueError: If `text` is missing or empty.
    Exception: For errors during API interaction or response parsing.
"""


import os
from groq import Groq
from dotenv import load_dotenv
import json
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def check_bias(text):
    try:
        logger.debug(f"Raw article text: {text}")
        logger.debug(f"JSON dump of text: {json.dumps(text)}")

        # Extract string if passed a dict from scraper pipeline
        article_text = text.get("cleaned_text", "") if isinstance(text, dict) else str(text or "")
        article_text = article_text.strip()

        if not article_text:
            logger.error("Missing or empty 'cleaned_text'")
            raise ValueError("No readable text could be extracted from this article.")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that checks if a given article is biased and provides "
                        "a score based on biasness where 0 is lowest bias (neutral) and 100 is highest bias. "
                        "Only return a single integer number between 0 and 100. Do not return any text, markdown, or explanation."
                    ),
                },
                {
                    "role": "user",
                    "content": f"Give bias score to the following article:\n\n{article_text}",
                },
            ],
            model="openai/gpt-oss-120b",
            temperature=0.2,
            max_tokens=32,
        )
        raw_score = (chat_completion.choices[0].message.content or "").strip()
        logger.info(f"Raw bias score calculated: {raw_score}")

        import re
        m = re.search(r"\b(\d{1,3})\b", raw_score)
        if not m:
            raise ValueError(f"No parseable score in model response: {raw_score!r}")
        score_val = max(0, min(100, int(m.group(1))))

        return {
            "bias_score": score_val,
            "status": "success",
        }

    except Exception as e:
        logger.exception("Error in bias detection")
        return {
            "status": "error",
            "error_from": "bias_detection",
            "message": str(e),
        }
