from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

prompt = PromptTemplate(
    input_variables=["text", "facts"],
    template="""Given the following article:
{text}

And the following verified facts:
{facts}

Generate a reasoned opposing perspective using chain-of-thought logic.
"""
)

my_llm = "groq llm"

chain = LLMChain(prompt=prompt, llm=my_llm)


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

        facts = "\n".join([f["snippet"] for f in state["facts"]])
        result = chain.run({"text": text, "facts": facts})
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
