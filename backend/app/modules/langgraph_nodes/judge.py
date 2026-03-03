import re
import asyncio
from langchain.schema import HumanMessage
from app.logging.logging_config import setup_logger
from app.llm_config import get_llm

logger = setup_logger(__name__)


async def judge_perspective(state: dict) -> dict:
    try:
        perspective_obj = state.get("perspective")

        # Extract the actual text from whichever shape perspective_obj has
        if hasattr(perspective_obj, "perspective"):
            text = perspective_obj.perspective
        elif isinstance(perspective_obj, dict):
            text = perspective_obj.get("perspective", "")
        else:
            text = str(perspective_obj) if perspective_obj else ""

        if not text:
            logger.warning("No perspective text found to judge.")
            return {**state, "score": 0, "status": "success"}

        provider = state.get("provider", "groq")
        llm = get_llm(provider, temperature=0.3)

        prompt = (
            "Rate the following counter-perspective on a scale of 0-100 based on:\n"
            "1. Originality and insight\n"
            "2. Quality of reasoning\n"
            "3. Factual grounding\n\n"
            f"Perspective:\n{text}\n\n"
            "Return ONLY a number between 0 and 100. No text, no explanation."
        )

        response = await asyncio.to_thread(
            llm.invoke, [HumanMessage(content=prompt)]
        )

        content = response.content.strip()
        numbers = re.findall(r"\d+", content)
        score = int(numbers[0]) if numbers else 50
        score = max(0, min(100, score))

        logger.info(f"Judge score: {score}")
        return {**state, "score": score, "status": "success"}

    except Exception as e:
        logger.exception(f"Error in judge_perspective: {e}")
        return {
            **state,
            "score": 50,
            "status": "error",
            "error_from": "judge",
            "message": str(e),
        }