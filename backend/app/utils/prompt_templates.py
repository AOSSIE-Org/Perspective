"""
prompt_templates.py
-------------------
Houses reusable prompt templates for LLM-based processing tasks within
the pipeline. These templates define structured, instructive contexts
for generating consistent and high-quality responses from language models.

Variables:
    generation_prompt (ChatPromptTemplate)
        - A LangChain ChatPromptTemplate configured to produce a 
          well-reasoned counter-perspective to an article.
        - Inputs:
            cleaned_article (str): The main text of the article.
            sentiment (str): The detected sentiment of the article.
            facts (list): Verified factual information related to the article.
        - Output:
            LLM is instructed to return a JSON object containing:
                - "counter_perspective": Opposite viewpoint to the article.
                - "reasoning_steps": Step-by-step reasoning sequence.

Usage:
    This prompt ensures responses are logical, respectful, and grounded 
    in evidence, making it suitable for perspective analysis, debate 
    generation, and bias exploration tasks.
"""


from langchain.prompts import ChatPromptTemplate

generation_prompt = ChatPromptTemplate.from_template("""
You are an AI assistant that generates a well-reasoned '
'counter-perspective to a given article.

## Article:
{cleaned_article}

## Sentiment:
{sentiment}

## Verified Facts:
{facts}

---

Generate a logical and respectful *opposite perspective* to the article.
Use *step-by-step reasoning* and return your output in this JSON format:

```json
{{
  "counter_perspective": "<your opposite point of view>",
  "reasoning_steps": [
    "<step 1>",
    "<step 2>",
    "<step 3>",
    "...",
    "<final reasoning>"
  ]
}}
""")
