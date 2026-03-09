"""
llm_processing.py (chat)
------------------------
Context-aware question answering using Groq LLM + Pinecone RAG.

Improvements over v1:
  - Explicit max_tokens and temperature (was using API defaults)
  - Context includes the actual claim TEXT, not just explanation/reasoning
  - Source links cited in context so LLM can reference them
  - Input validation and error handling
  - Conversation-style system prompt with clear citation instructions
"""

import os
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)
load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

_SYSTEM_PROMPT = """You are Perspective-AI, an expert media literacy and fact-checking assistant.
Answer the user's question using ONLY the provided context from verified article analysis.
If the context is insufficient, say so clearly rather than speculating.
Cite sources where available. Be concise, precise, and intellectually honest.
Do not fabricate information or invent citations."""


def build_context(docs: list[dict]) -> str:
    """
    Build a rich context string from RAG matches.
    Includes the claim text, verdict, explanation, and source link.
    """
    if not docs:
        return "No relevant context found."

    parts = []
    for i, match in enumerate(docs, 1):
        meta = match.get("metadata", {})
        score = match.get("score", 0)
        doc_type = meta.get("type", "unknown")

        if doc_type == "fact":
            part = (
                f"[Source {i} | type=fact | relevance={score:.2f}]\n"
                f"Claim: {meta.get('text', match.get('id', ''))}\n"
                f"Verdict: {meta.get('verdict', 'Unknown')} "
                f"(Confidence: {meta.get('confidence', 'Unknown')})\n"
                f"Explanation: {meta.get('explanation', '')}\n"
                f"Source: {meta.get('source_link', 'N/A')}"
            )
        elif doc_type == "counter-perspective":
            part = (
                f"[Source {i} | type=counter-perspective | relevance={score:.2f}]\n"
                f"Perspective: {meta.get('reasoning', '')}"
            )
        else:
            part = (
                f"[Source {i} | relevance={score:.2f}]\n"
                f"{meta.get('explanation') or meta.get('reasoning', '')}"
            )
        parts.append(part)

    return "\n\n---\n\n".join(parts)


def ask_llm(question: str, docs: list[dict]) -> str:
    if not question or not question.strip():
        return "Please ask a question."

    context = build_context(docs)
    prompt = f"""Context from article analysis:
{context}

User question: {question}

Answer (cite sources where relevant):"""

    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,  # low for factual Q&A
            max_tokens=600,
        )
        answer = response.choices[0].message.content.strip()
        logger.info(f"Chat answered for: {question[:60]}")
        return answer

    except Exception as e:
        logger.exception(f"Chat LLM error: {e}")
        return "I encountered an error generating a response. Please try again."
