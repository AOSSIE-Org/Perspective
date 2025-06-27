from app.utils.prompt_templates import generation_prompt
from langchain_groq import ChatGroq
from pydantic import BaseModel, Field


prompt = generation_prompt


class PerspectiveOutput(BaseModel):
    reasoning: str = Field(..., description="Chain-of-thought reasoning steps")
    perspective: str = Field(..., description="Generated opposite perspective")


my_llm = "llama-3.3-70b-versatile"

llm = ChatGroq(
    model=my_llm,
    temperature=0.7
)

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
        elif not facts:
            raise ValueError("Missing or empty 'facts' in state")

        facts_str = "\n".join([f"Claim: {f['original_claim']}\n"
                               "Verdict: {f['verdict']}\nExplanation: "
                               "{f['explanation']}" for f in state["facts"]])

        result = chain.invoke({
            "cleaned_article": text,
            "facts": facts_str,
            "sentiment": state.get("sentiment", "neutral")
        })
    except Exception as e:
        print(f"some error occured in generate_perspective:{e}")
        return {
            "status": "error",
            "error_from": "generate_perspective",
            "message": f"{e}",
        }
    return {
        **state,
        "perspective": result,
        "status": "success"
        }
