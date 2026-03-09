"""
prompt_templates.py
-------------------
Prompt templates for LLM-based analysis tasks.

generation_prompt:
    Generates a rigorous, evidence-grounded counter-perspective.
    The improved prompt enforces:
    - Intellectual honesty (acknowledge valid points in the article)
    - Specific counter-arguments tied to evidence
    - structured JSON output with perspective + reasoning chain
"""

from langchain.prompts import ChatPromptTemplate

generation_prompt = ChatPromptTemplate.from_template("""
You are a rigorous critical thinker and expert analyst. Your job is to construct
a well-reasoned, intellectually honest counter-perspective to a given article.

## Article Text (excerpt):
{cleaned_article}

## Detected Sentiment:
{sentiment}

## Verified Facts (treat these as ground truth):
{facts}

---

### Instructions:
1. First, identify 1-2 valid points the article makes (steelmanning).
2. Then, construct a substantive, fact-grounded counter-perspective that challenges
   the article's main thesis or framing.
3. The counter-perspective should NOT be a mirror opposite — it should reflect a
   genuinely different but defensible viewpoint.
4. Ground every claim in evidence, logic, or established academic/journalistic consensus.
5. Avoid personal attacks, false equivalence, or strawmanning.

Return ONLY the following JSON (no markdown fences, no extra text):
{{
  "perspective": "<2-4 sentence counter-perspective that directly challenges the article's central argument>",
  "reasoning": "<detailed 100-150 word reasoning chain explaining HOW and WHY this counter-perspective is valid>",
  "steelman": "<one sentence acknowledging the strongest point the article makes>",
  "themes": [<3-5 keyword themes the counter-perspective addresses>]
}}
""")
