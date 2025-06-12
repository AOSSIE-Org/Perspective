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
    text = state["cleaned_text"]
    facts = "\n".join([f["snippet"] for f in state["facts"]])
    result = chain.run({"text": text, "facts": facts})
    return {
        **state,
        "perspective": result
        }
