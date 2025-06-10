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
    """
    Generates a reasoned opposing perspective on an article using provided factual snippets.
    
    Args:
        state: A dictionary containing "text" (the article) and "facts" (a list of fact dictionaries with "snippet" fields).
    
    Returns:
        A dictionary with the generated opposing perspective under the key "perspective".
    """
    text = state["text"]
    facts = "\n".join([f["snippet"] for f in state["facts"]])
    result = chain.run({"text": text, "facts": facts})
    return {"perspective": result}
