"""
sentiment.py
------------
Performs sentiment analysis on cleaned article text using Groq's LLM.

This module:
    - Accepts pre-processed article text from the pipeline state.
    - Uses an LLM to classify sentiment as Positive, Negative, or Neutral.
    - Returns the sentiment label along with updated pipeline state.

Functions:
    run_sentiment_sdk(state: dict) -> dict:
        Analyzes sentiment and updates the state with the result.
    
    run_parallel_analysis(state: dict) -> dict:
        Runs sentiment analysis and fact-checking tool nodes in parallel.
        Combines claims, search_queries, search_results, and facts into state.
"""

import asyncio
import os
from groq import Groq
from dotenv import load_dotenv
from app.logging.logging_config import setup_logger
from app.llm_config import LLM_MODEL
from app.modules import fact_check_tool

logger = setup_logger(__name__)

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))


async def run_parallel_analysis(state):
    """
    The fact-checking pipeline runs sequentially:
        extract_claims -> plan_searches -> execute_searches -> verify_facts
    """
    async def run_fact_check_pipeline(state):
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
                "status": "success"
            }
        except Exception as e:
            logger.exception(f"Error in fact_check_pipeline: {e}")
            return {
                "status": "error",
                "error_from": "fact_checking",
                "message": str(e)
            }

    sentiment_task = asyncio.to_thread(run_sentiment_sdk, state)
    fact_check_task = run_fact_check_pipeline(state)

    sentiment_result, fact_check_result = await asyncio.gather(
        sentiment_task, fact_check_task
    )
    if sentiment_result.get("status") == "error":
        return {
            "status": "error",
            "error_from": sentiment_result.get("error_from", "sentiment_analysis"),
            "message": sentiment_result.get("message", "Unknown error")
        }
    if fact_check_result.get("status") == "error":
        return {
            "status": "error",
            "error_from": fact_check_result.get("error_from", "fact_checking"),
            "message": fact_check_result.get("message", "Unknown error")
        }

    return {
        **state,
        "sentiment": sentiment_result.get("sentiment"),
        "claims": fact_check_result.get("claims", []),
        "search_queries": fact_check_result.get("search_queries", []),
        "search_results": fact_check_result.get("search_results", []),
        "facts": fact_check_result.get("facts", []),
        "status": "success"
    }

def run_sentiment_sdk(state):
    try:
        text = state.get("cleaned_text")
        if not text:
            raise ValueError("Missing or empty 'cleaned_text' in state")

        chat_completion = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are a sentiment analysis assistant. "
                        "Only respond with one word:"
                        " Positive, Negative, or Neutral."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Analyze the sentiment of the following text:\n\n{text}"
                    ),
                },
            ],
            model=LLM_MODEL,
            temperature=0.2,
            max_tokens=3,
        )

        sentiment = chat_completion.choices[0].message.content.strip()
        sentiment = sentiment.lower()

        return {
            **state,
            "sentiment": sentiment,
            "status": "success",
        }

    except Exception as e:
        logger.exception(f"Error in sentiment_analysis: {e}")
        return {
            "status": "error",
            "error_from": "sentiment_analysis",
            "message": str(e),
        }


# if __name__ == "__main__":
#     dummy_state = {
#         "cleaned_text": (
#             "The 2025 French Open men’s final at Roland Garros was more than"
#             "just a sporting event."
#         )
#     }

#     result = run_sentiment_sdk(dummy_state)
#     print("Sentiment Output:", result)
