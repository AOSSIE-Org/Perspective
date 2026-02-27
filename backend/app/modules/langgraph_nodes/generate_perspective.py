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
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


prompt = generation_prompt


class PerspectiveOutput(BaseModel):
    reasoning: str = Field(..., description="Chain-of-thought reasoning steps")
    perspective: str = Field(..., description="Generated opposite perspective")



def generate_perspective(state):
    try:
        retries = state.get("retries", 0)
        state["retries"] = retries + 1

        text = state["cleaned_text"]
        facts = state.get("facts")

        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        llm = ChatGroq(model=state["groq_model"], temperature=0.7, api_key=state["groq_api_key"])
        chain = prompt | llm.with_structured_output(PerspectiveOutput)

        # facts may be empty if web search failed — generate perspective without them
        facts_str = "\n".join(
            [
                f"Claim: {f['original_claim']}\n"
                "Verdict: {f['verdict']}\nExplanation: "
                "{f['explanation']}"
                for f in (facts or [])
            ]
        ) or "No verified facts available."

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
