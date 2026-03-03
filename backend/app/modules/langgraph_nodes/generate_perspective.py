"""
generate_perspective.py
-----------------------
Generates an alternative perspective for a given article based on verified claims.

This module:
    - Uses a LangChain pipeline with Groq's LLM to produce a reasoning chain
      and an opposite perspective.
    - Validates required inputs before generation.
    - Handles errors gracefully and returns structured responses.

Classes:
    PerspectiveOutput (pydantic.BaseModel):
        Data model for structured LLM output containing reasoning and perspective.

Functions:
    generate_perspective(state: dict) -> dict:
        Generates an alternative perspective using the provided article text
        and verified facts.
"""


import asyncio
from typing import List

from pydantic import BaseModel, Field
from langchain.schema.runnable import RunnableSequence

from app.utils.prompt_templates import generation_prompt
from app.llm_config import get_llm
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


class PerspectiveOutput(BaseModel):
    short_title: str = Field(description="A catchy, concise title for this analysis (max 10 words)")
    perspective: str = Field(description="Generated opposite perspective")
    reasoning_steps: List[str] = Field(description="Chain-of-thought reasoning steps")


async def generate_perspective(state: dict) -> dict:
    try:
        retries = state.get("retries", 0) + 1
        text = state.get("cleaned_text", "")
        facts = state.get("facts")
        provider = state.get("provider", "groq")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        # Build the chain dynamically based on provider
        llm = get_llm(provider, temperature=0.7)
        structured_llm = llm.with_structured_output(PerspectiveOutput)
        chain: RunnableSequence = generation_prompt | structured_llm

        if not facts:
            logger.warning("No facts found. Generating perspective based on text only.")
            facts_str = "No specific claims verified."
        else:
            facts_str = "\n".join(
                [
                    f"Claim: {f.get('claim', f.get('original_claim', 'Unknown'))}\n"
                    f"Verdict: {f.get('status', f.get('verdict', 'Unknown'))}\n"
                    f"Explanation: {f.get('reason', f.get('explanation', 'No explanation'))}"
                    for f in facts
                ]
            )

        result = await asyncio.to_thread(
            chain.invoke,
            {
                "cleaned_article": text,
                "facts": facts_str,
                "sentiment": state.get("sentiment", "neutral"),
            },
        )

        return {**state, "perspective": result, "retries": retries, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in generate_perspective: {e}")
        return {"status": "error", "error_from": "generate_perspective", "message": str(e)}