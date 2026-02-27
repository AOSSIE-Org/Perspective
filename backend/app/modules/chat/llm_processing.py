"""
llm_processing.py
-----------------
Handles Large Language Model (LLM) interactions for context-based question answering.

This module:
    - Connects to the Groq API using credentials from environment variables.
    - Builds a context string from retrieved documents.
    - Sends user questions along with context to the LLM.
    - Returns generated answers.

Functions:
    build_context(docs: list[dict]) -> str:
        Extracts relevant fields (explanation or reasoning) from document
        metadata and combines them into a single context string.

    ask_llm(question: str, docs: list[dict]) -> str:
        Builds context from the provided documents, sends it along with the
        question to the LLM, and returns the model's answer.

Environment Variables:
    GROQ_API_KEY (str): API key for authenticating with Groq.
"""


import os
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)

load_dotenv()


def build_context(docs):
    return "\n".join(
        f"{m['metadata'].get('explanation') or m['metadata'].get('reasoning', '')}"
        for m in docs
    )


def ask_llm(question, docs, api_key: str, groq_model: str = "llama-3.3-70b-versatile", article_text: str = ""):
    client = Groq(api_key=api_key)
    pinecone_context = build_context(docs)
    logger.debug(f"Generated context for LLM:\n{pinecone_context}")

    context_parts = []
    if article_text:
        context_parts.append(f"=== Full Article ===\n{article_text}")
    if pinecone_context:
        context_parts.append(f"=== Fact-Check Notes ===\n{pinecone_context}")
    context = "\n\n".join(context_parts) or "No context available."

    prompt = f"""You are an assistant that answers questions about a news article.

Context:
{context}

Question:
{question}
"""

    response = client.chat.completions.create(
        model=groq_model,
        messages=[
            {"role": "system", "content": "Use only the context to answer."},
            {"role": "user", "content": prompt},
        ],
    )
    logger.info("LLM response retrieved successfully.")
    return response.choices[0].message.content
