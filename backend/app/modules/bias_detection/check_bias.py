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
from app.llm_config import LLM_MODEL

logger = setup_logger(__name__)

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def check_bias(text):
    try:
        logger.debug(f"Raw article text: {text}")
        logger.debug(f"JSON dump of text: {json.dumps(text)}")

        if not text:
            logger.error("Missing or empty 'cleaned_text'")
            raise ValueError("Missing or empty 'cleaned_text'")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that checks  "
                        "if given article is biased and give"
                        "score to each based on biasness where 0 is lowest bias and 100 is highest bias"
                        "Only return a number between 0 to 100 base on bias."
                        "only return Number No Text"
                    ),
                },
                {
                    "role": "user",
                    "content": (f"Give bias score to the following article \n\n{text}"),
                },
            ],
            model=LLM_MODEL,
            temperature=0.3,
            max_tokens=512,
        )
        bias_score = chat_completion.choices[0].message.content.strip()
        logger.info(f"Bias score calculated: {bias_score}")

        return {
            "bias_score": bias_score,
            "status": "success",
        }

    except Exception as e:
        logger.exception("Error in bias detection")
        return {
            "status": "error",
            "error_from": "bias_detection",
            "message": str(e),
        }
