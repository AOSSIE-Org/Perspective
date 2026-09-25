"""
generate_perspective.py
-----------------------
Generates an alternative perspective for a given article based on verified claims.
"""

import os
import json
from groq import Groq
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


class PerspectiveOutput(BaseModel):
    reasoning: str = Field(..., description="Chain-of-thought reasoning steps")
    perspective: str = Field(..., description="Generated opposite perspective")


my_llm = "openai/gpt-oss-120b"


def generate_perspective(state):
    try:
        retries = state.get("retries", 0)
        state["retries"] = retries + 1

        text = state.get("cleaned_text", "")
        facts = state.get("facts", [])

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        if facts:
            facts_str = "\n".join(
                [
                    f"Claim: {f.get('original_claim', '')}\nVerdict: {f.get('verdict', 'Unverified')}\nExplanation: {f.get('explanation', '')}"
                    for f in facts
                ]
            )
        else:
            facts_str = "No specific isolated claims extracted; examine the general premises of the article."

        sentiment = state.get("sentiment", "neutral")

        system_prompt = (
            "You are an expert perspective-generation assistant for Perspective AI. "
            "Your role is to construct a balanced, rigorous, and factually grounded alternative / counter-perspective "
            "to challenged or biased viewpoints in online articles. "
            "You must return your output strictly as a JSON object with two keys:\n"
            "1. \"reasoning\": A detailed explanation of why the counter-arguments and alternative tradeoffs exist.\n"
            "2. \"perspective\": The final synthesized counter-perspective narrative directly addressing the article claims."
        )

        user_content = (
            f"Article Content:\n{text}\n\n"
            f"Fact-Checking Findings:\n{facts_str}\n\n"
            f"Detected Sentiment: {sentiment}\n\n"
            "Please generate the alternative perspective in JSON format with keys 'reasoning' and 'perspective'."
        )

        chat_completion = client.chat.completions.create(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_content},
            ],
            model=my_llm,
            temperature=0.6,
            response_format={"type": "json_object"},
        )

        content = chat_completion.choices[0].message.content.strip()
        parsed_json = json.loads(content)

        # Build PerspectiveOutput model
        result = PerspectiveOutput(
            reasoning=parsed_json.get("reasoning", "Analysis of systemic factors and counter-evidence."),
            perspective=parsed_json.get("perspective", parsed_json.get("counter_perspective", content)),
        )

        return {**state, "perspective": result, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in generate_perspective: {e}")
        return {
            "status": "error",
            "error_from": "generate_perspective",
            "message": f"{e}",
        }
