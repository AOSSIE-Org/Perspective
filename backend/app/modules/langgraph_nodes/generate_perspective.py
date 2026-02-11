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


from app.utils.prompt_templates import generation_prompt
from app.llm_config import LLM_MODEL
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from app.logging.logging_config import setup_logger
from typing import List
logger = setup_logger(__name__)


prompt = generation_prompt


class PerspectiveOutput(BaseModel):
    reasoning: List[str] = Field(description="Chain-of-thought reasoning steps", alias="reasoning_steps")
    perspective: str = Field(..., description="Generated opposite perspective")


my_llm = LLM_MODEL

llm = ChatGroq(model=my_llm, temperature=0.7)

structured_llm = llm.with_structured_output(PerspectiveOutput)


chain = prompt | structured_llm


def generate_perspective(state):
    try:
        retries = state.get("retries", 0)
        state["retries"] = retries + 1

        text = state["cleaned_text"]
        facts = state.get("facts")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")
        if not facts:
            logger.warning("No facts found in state. Generating perspective based on text only.")
            facts_str = "No specific claims verified."
        else:
            facts_str = "\n".join(
                [
                    f"Claim: {f.get('claim', f.get('original_claim', 'Unknown Claim'))}\n"
                    f"Verdict: {f.get('status', f.get('verdict', 'Unknown Verdict'))}\n"
                    f"Explanation: {f.get('reason', f.get('explanation', 'No explanation'))}"
                    for f in facts
                ]
            )

        result = chain.invoke(
            {
                "cleaned_article": text,
                "facts": facts_str,
                "sentiment": state.get("sentiment", "neutral"),
            }
        )
    except Exception as e:
        logger.exception(f"Error in generate_perspective: {e}")
        return {
            "status": "error",
            "error_from": "generate_perspective",
            "message": f"{e}",
        }
    return {**state, "perspective": result, "status": "success"}
