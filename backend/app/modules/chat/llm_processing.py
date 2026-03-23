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

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def build_context(docs):
    return "\n".join(
        f"{m['metadata'].get('explanation') or m['metadata'].get('reasoning', '')}"
        for m in docs
    ).strip()


def ask_llm(question, docs, article_context=""):
    rag_context = build_context(docs)
    article_context = (article_context or "").strip()

    if rag_context and article_context:
        context = f"Article:\n{article_context}\n\nRetrieved Insights:\n{rag_context}"
    else:
        context = rag_context or article_context

    if not context:
        return (
            "I don't have article context yet. Please analyze an article first and then ask me again."
        )

    logger.debug(f"Generated context for LLM:\n{context}")
    prompt = f"""You are an assistant that answers based on context.

Context:
{context}

Question:
{question}
"""

    response = client.chat.completions.create(
        model="llama-3.1-8b-instant",
        messages=[
            {"role": "system", "content": "Use only the context to answer."},
            {"role": "user", "content": prompt},
        ],
    )
    logger.info("LLM response retrieved successfully.")
    return response.choices[0].message.content
    
    