"""
llm_processing.py
-----------------
Handles claim extraction and fact verification tasks using the Groq LLM API.

This module:
    - Connects to the Groq API with credentials from environment variables.
    - Extracts verifiable factual claims from text.
    - Verifies claims using provided search results and evidence.
    - Returns structured responses with verdicts and explanations.

Functions:
    run_claim_extractor_sdk(state: dict) -> dict:
        Extracts up to three concise, verifiable claims from the input text
        stored in the `state` dictionary.

    run_fact_verifier_sdk(search_results: list[dict]) -> dict:
        Evaluates provided claims against web search evidence and returns
        structured JSON verdicts for each claim.

Environment Variables:
    GROQ_API_KEY (str): API key for authenticating with Groq.
"""


import os
from groq import Groq
from dotenv import load_dotenv
import json
import re
from app.logging.logging_config import setup_logger
from app.llm_config import LLM_MODEL

logger = setup_logger(__name__)

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def run_claim_extractor_sdk(state):
    try:
        text = state.get("cleaned_text")
        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an assistant that extracts "
                        "verifiable factual claims from articles. "
                        "Each claim must be short, fact-based, and"
                        " independently verifiable through internet search. "
                        "Only return a list of 3 clear bullet-point claims."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Extract verifiable claims "
                        f"from the following article:\n\n{text}"
                    ),
                },
            ],
            model=LLM_MODEL,
            temperature=0.3,
            max_tokens=512,
        )

        extracted_claims = chat_completion.choices[0].message.content.strip()
        logger.debug(f"Extracted claims:\n{extracted_claims}")


        return {
            **state,
            "verifiable_claims": extracted_claims,
            "status": "success",
        }

    except Exception as e:
        logger.exception("Error in claim_extraction")
        return {
            "status": "error",
            "error_from": "claim_extraction",
            "message": str(e),
        }


def run_fact_verifier_sdk(search_results):
    try:
        results_list = []

        for result in search_results:
            source = result.get("link", "N/A")
            claim = result.get("claim", "N/A")
            evidence = (
                f"{result.get('title', '')}"
                f"\n{result.get('snippet', '')}"
                f"\nLink: {source}"
            )

            chat_completion = client.chat.completions.create(
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are a fact-checking assistant. "
                            "Your job is to determine whether the given"
                            " claim is True, False"
                            "based on the provided web search evidence."
                            " Keep it concise and structured."
                        ),
                    },
                    {
                        "role": "user",
                        "content": (
                            f"Claim: {claim}\n\n"
                            f"Web Evidence:\n{evidence}\n\n"
                            "Based on this evidence, is the claim true?\n"
                            "Respond only in this JSON format:\n\n"
                            "{\n"
                            '  "verdict": "True" | "False",\n'
                            '  "explanation": "...",\n'
                            f'  "original_claim": "{claim}",\n'
                            f'  "source_link": "{source}"\n'
                            "}"
                        ),
                    },
                ],
                model=LLM_MODEL,
                temperature=0.3,
                max_tokens=256,
            )

            content = chat_completion.choices[0].message.content.strip()

            # Strip markdown code blocks if present
            content = re.sub(r"^```json|```$", "", content).strip()
            logger.debug(f"Raw LLM fact verification output:\n{content}")

            # Try parsing the JSON response
            try:
                parsed = json.loads(content)
            except Exception as parse_err:
                logger.error(f"LLM JSON parse error: {parse_err}")

            results_list.append(parsed)

        return {
            "claim": claim,
            "verifications": results_list,
            "status": "success",
        }

    except Exception as e:
        logger.exception("Error in fact_verification")
        return {
            "status": "error",
            "error_from": "fact_verification",
            "message": str(e),
        }
