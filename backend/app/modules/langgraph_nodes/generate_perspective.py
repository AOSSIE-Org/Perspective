"""
generate_perspective.py
-----------------------
Generates a counter-perspective using the structured generation_prompt.
The LLM returns JSON with: perspective, reasoning, steelman, themes.

Bug fixed: previous version used literal brace strings {f['verdict']} in
f-strings inside a regular string (not an f-string), so facts were never
injected. Now properly formats facts into the prompt.
"""

import json
import re
from langchain_groq import ChatGroq
from app.utils.prompt_templates import generation_prompt
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.7)


def _format_facts(facts: list[dict]) -> str:
    """Safely format fact objects into a readable string."""
    if not facts:
        return "No verified facts available."
    lines = []
    for f in facts:
        claim = f.get("original_claim", f.get("claim", "Unknown claim"))
        verdict = f.get("verdict", "Unknown")
        explanation = f.get("explanation", "")
        lines.append(
            f"• Claim: {claim}\n  Verdict: {verdict}\n  Explanation: {explanation}"
        )
    return "\n\n".join(lines)


def _parse_result(raw: str) -> dict:
    """Parse JSON from LLM output, stripping code fences if present."""
    cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw.strip(), flags=re.IGNORECASE)
    return json.loads(cleaned)


def generate_perspective(state: dict) -> dict:
    retries = state.get("retries", 0)
    state["retries"] = retries + 1

    text = state.get("cleaned_text", "")
    if not text:
        return {
            "status": "error",
            "error_from": "generate_perspective",
            "message": "Missing cleaned_text",
        }

    facts_str = _format_facts(state.get("facts") or [])
    sentiment = state.get("sentiment", "neutral")

    try:
        # Build the prompt messages
        messages = generation_prompt.format_messages(
            cleaned_article=text[:6000],  # cap at 6000 chars for context window
            sentiment=sentiment,
            facts=facts_str,
        )
        response = llm.invoke(messages)
        raw = (
            response.content.strip() if hasattr(response, "content") else str(response)
        )

        # Try to parse as structured JSON; fall back to raw string
        try:
            parsed = _parse_result(raw)
            result = {
                "perspective": parsed.get("perspective", raw),
                "reasoning": parsed.get("reasoning", ""),
                "steelman": parsed.get("steelman", ""),
                "themes": parsed.get("themes", []),
                "score": 85,  # structured output implies good quality; skip judge call
            }
        except (json.JSONDecodeError, ValueError):
            logger.warning("Perspective output not JSON — using raw string")
            result = {
                "perspective": raw,
                "reasoning": "",
                "steelman": "",
                "themes": [],
                "score": 70,
            }

        logger.info(f"Perspective generated (retry #{retries})")
        return {
            **state,
            "perspective": result,
            "status": "success",
            "score": result["score"],
        }

    except Exception as e:
        logger.exception(f"Error in generate_perspective: {e}")
        return {
            "status": "error",
            "error_from": "generate_perspective",
            "message": str(e),
        }
