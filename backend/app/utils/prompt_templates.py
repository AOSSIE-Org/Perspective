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
