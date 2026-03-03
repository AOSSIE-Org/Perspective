from langchain.prompts import ChatPromptTemplate

generation_prompt = ChatPromptTemplate.from_template(
    """You are an AI assistant that generates a well-reasoned counter-perspective \
to a given article.

Article:
{cleaned_article}

Sentiment:
{sentiment}

Verified Facts:
{facts}

Generate a logical, respectful opposite perspective to the article.
Use step-by-step reasoning and provide a catchy short title (max 10 words)."""
)