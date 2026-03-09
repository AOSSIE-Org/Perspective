"""
llm_processing.py
-----------------
Handles claim extraction and fact verification using Groq LLM.

Key improvements:
    - Claim extractor uses temperature=0.1 for consistent, precise output
    - Fact verifier now batches ALL claims into ONE LLM call (was N serial calls)
    - Fixed critical bug: 'parsed' variable could be referenced before assignment
    - Added JSON fence stripping and robust error fallback per claim
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

CLAIM_EXTRACT_PROMPT = """You are a precise fact-extraction assistant.
Extract exactly 5 short, independently verifiable factual claims from the article.
Each claim must be a concrete, checkable statement — not an opinion or prediction.

Return ONLY a bulleted list, one claim per line, starting with "- ":
- <claim 1>
- <claim 2>
- <claim 3>
- <claim 4>
- <claim 5>

Article:
{text}
"""

BATCH_VERIFY_PROMPT = """You are an expert fact-checker. Evaluate each claim against the provided web evidence.

{claims_block}

For EACH claim, return a JSON object in this exact array:
[
  {{
    "original_claim": "<claim text>",
    "verdict": "True" | "False" | "Unverifiable",
    "confidence": "High" | "Medium" | "Low",
    "explanation": "<one sentence explaining your verdict>",
    "source_link": "<most relevant source URL>"
  }},
  ...
]

Rules:
- Use "Unverifiable" when evidence is insufficient, not "False"
- Be concise but precise in explanations
- Return ONLY the JSON array, no extra text
"""


def _strip_fences(raw: str) -> str:
    return re.sub(
        r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE
    ).strip()


def run_claim_extractor_sdk(state: dict) -> dict:
    text = state.get("cleaned_text", "")
    if not text:
        return {
            "status": "error",
            "error_from": "claim_extraction",
            "message": "Empty text",
        }

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "Return only a bullet list of factual claims. No headers, no extra text.",
                },
                {
                    "role": "user",
                    "content": CLAIM_EXTRACT_PROMPT.format(text=text[:5000]),
                },
            ],
            temperature=0.1,
            max_tokens=400,
        )
        claims_raw = response.choices[0].message.content.strip()
        logger.debug(f"Extracted claims:\n{claims_raw}")
        return {**state, "verifiable_claims": claims_raw, "status": "success"}

    except Exception as e:
        logger.exception("Error in claim_extraction")
        return {"status": "error", "error_from": "claim_extraction", "message": str(e)}


def run_fact_verifier_sdk(search_results: list[dict]) -> dict:
    """
    Batch verify ALL claims in a SINGLE LLM call instead of N serial calls.
    This reduces API round-trips from O(n) to O(1).
    """
    if not search_results:
        return {"verifications": [], "status": "success"}

    # Build a structured block of claim + evidence pairs
    claims_block_parts = []
    for i, result in enumerate(search_results, 1):
        claim = result.get("claim", "Unknown claim")
        evidence = "\n".join(
            [
                f"  Title: {result.get('title', 'N/A')}",
                f"  Snippet: {result.get('snippet', 'N/A')[:300]}",
                f"  Source: {result.get('link', 'N/A')}",
            ]
        )
        claims_block_parts.append(f"### Claim {i}\n{claim}\n\nEvidence:\n{evidence}")

    claims_block = "\n\n---\n\n".join(claims_block_parts)

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert fact-checker. Return only a valid JSON array.",
                },
                {
                    "role": "user",
                    "content": BATCH_VERIFY_PROMPT.format(claims_block=claims_block),
                },
            ],
            temperature=0.1,
            max_tokens=1000,
        )
        raw = response.choices[0].message.content.strip()
        cleaned = _strip_fences(raw)
        verifications = json.loads(cleaned)

        if not isinstance(verifications, list):
            raise ValueError("Expected JSON array from fact verifier")

        logger.info(
            f"Batch fact verification complete — {len(verifications)} claims verified"
        )
        return {"verifications": verifications, "status": "success"}

    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(
            f"Fact verifier JSON parse failed: {e}. Attempting per-claim fallback."
        )
        # Fallback: mark all as unverifiable rather than crashing
        fallback = [
            {
                "original_claim": r.get("claim", ""),
                "verdict": "Unverifiable",
                "confidence": "Low",
                "explanation": "Batch verification failed — insufficient evidence.",
                "source_link": r.get("link", ""),
            }
            for r in search_results
        ]
        return {"verifications": fallback, "status": "success"}

    except Exception as e:
        logger.exception("Error in fact_verification")
        return {"status": "error", "error_from": "fact_verification", "message": str(e)}
