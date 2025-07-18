import re
from langchain_groq import ChatGroq
from langchain.schema import HumanMessage

# Init once
groq_llm = ChatGroq(
    model="gemma2-9b-it",
    temperature=0.0,
    max_tokens=10,
)


def judge_perspective(state):
    try:
        perspective_obj = state.get("perspective")
        text = getattr(perspective_obj, "perspective", "").strip()
        if not text:
            raise ValueError("Empty 'perspective' for scoring")

        prompt = f"""
You are an expert evaluator. Please rate the following counter-perspective
on originality, reasoning quality, and factual grounding. Provide ONLY
a single integer score from 0 (very poor) to 100 (excellent).

=== Perspective to score ===
{text}
"""

        response = groq_llm.invoke([HumanMessage(content=prompt)])

        if isinstance(response, list) and response:
            raw = response[0].content.strip()
        elif hasattr(response, "content"):
            raw = response.content.strip()
        else:
            raw = str(response).strip()

        # 5) Pull the first integer 0–100
        m = re.search(r"\b(\d{1,3})\b", raw)
        if not m:
            raise ValueError(f"Couldn’t parse a score from: '{raw}'")

        score = max(0, min(100, int(m.group(1))))

        return {**state, "score": score, "status": "success"}

    except Exception as e:
        print(f"Error in judge_perspective: {e}")
        return {
            "status": "error",
            "error_from": "judge_perspective",
            "message": str(e),
        }
