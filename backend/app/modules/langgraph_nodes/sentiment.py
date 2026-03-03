"""
sentiment.py
------------
Parallel analysis node: sentiment + fact-check + summary.
Supports provider-based LLM routing (BYOK).
"""

import asyncio
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

from app.logging.logging_config import setup_logger
from app.llm_config import get_llm
from app.modules import fact_check_tool

logger = setup_logger(__name__)
load_dotenv()


# ---------------------------------------------------------------------------
# Public entry-point (LangGraph node)
# ---------------------------------------------------------------------------

async def run_parallel_analysis(state):
    provider = state.get("provider", "groq")

    sentiment_task = asyncio.to_thread(run_sentiment, state, provider)
    fact_check_task = _run_fact_check_pipeline(state)
    summary_task = asyncio.to_thread(generate_summary, state, provider)

    sentiment_result, fact_check_result, summary_result = await asyncio.gather(
        sentiment_task, fact_check_task, summary_task
    )

    for result, source in [
        (sentiment_result, "sentiment_analysis"),
        (fact_check_result, "fact_checking"),
        (summary_result, "summary_generation"),
    ]:
        if result.get("status") == "error":
            return {
                "status": "error",
                "error_from": result.get("error_from", source),
                "message": result.get("message", "Unknown error"),
            }

    return {
        **state,
        "sentiment": sentiment_result.get("sentiment"),
        "claims": fact_check_result.get("claims", []),
        "search_queries": fact_check_result.get("search_queries", []),
        "search_results": fact_check_result.get("search_results", []),
        "facts": fact_check_result.get("facts", []),
        "web_search_citations": fact_check_result.get("web_search_citations", []),
        "article_summary": summary_result.get("article_summary", ""),
        "status": "success",
    }


# ---------------------------------------------------------------------------
# Fact-check sub-pipeline (always uses Groq internally for JSON-mode)
# ---------------------------------------------------------------------------

async def _run_fact_check_pipeline(state):
    try:
        claims_result = await fact_check_tool.extract_claims_node(state)
        current_state = {**state, **claims_result}

        searches_result = await fact_check_tool.plan_searches_node(current_state)
        current_state = {**current_state, **searches_result}

        exec_result = await fact_check_tool.execute_searches_node(current_state)
        current_state = {**current_state, **exec_result}

        verify_result = await fact_check_tool.verify_facts_node(current_state)
        current_state = {**current_state, **verify_result}

        return {
            "claims": current_state.get("claims", []),
            "search_queries": current_state.get("search_queries", []),
            "search_results": current_state.get("search_results", []),
            "facts": current_state.get("facts", []),
            "web_search_citations": current_state.get("web_search_citations", []),
            "status": "success",
        }
    except Exception as e:
        logger.exception(f"Error in fact_check_pipeline: {e}")
        return {
            "status": "error",
            "error_from": "fact_checking",
            "message": str(e),
        }


# ---------------------------------------------------------------------------
# Sentiment (provider-aware)
# ---------------------------------------------------------------------------

def run_sentiment(state, provider: str = "groq"):
    try:
        text = state.get("cleaned_text")
        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        llm = get_llm(provider, temperature=0.2)
        response = llm.invoke([
            SystemMessage(content=(
                "You are a sentiment analysis assistant. "
                "Only respond with one word: Positive, Negative, or Neutral."
            )),
            HumanMessage(content=f"Analyze the sentiment of the following text:\n\n{text[:4000]}"),
        ])
        sentiment = response.content.strip().lower()
        logger.info(f"Sentiment result: {sentiment}")
        return {"sentiment": sentiment, "status": "success"}
    except Exception as e:
        logger.exception(f"Error in sentiment_analysis: {e}")
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": str(e),
        }


# ---------------------------------------------------------------------------
# Summary (provider-aware)
# ---------------------------------------------------------------------------

def generate_summary(state, provider: str = "groq"):
    try:
        text = state.get("cleaned_text", "")
        if not text:
            return {"article_summary": "", "status": "success"}

        llm = get_llm(provider, temperature=0.3)
        response = llm.invoke([
            SystemMessage(content=(
                "You are a concise summarizer. Provide a clear, neutral, "
                "3-5 sentence summary of the article. Focus on key facts "
                "and the main argument."
            )),
            HumanMessage(content=f"Summarize this article:\n\n{text[:4000]}"),
        ])
        summary = response.content.strip()
        logger.info("Article summary generated successfully.")
        return {"article_summary": summary, "status": "success"}
    except Exception as e:
        logger.exception(f"Error generating summary: {e}")
        return {
            "status": "error",
            "error_from": "summary_generation",
            "message": str(e),
        }