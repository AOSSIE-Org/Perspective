"""
fact_check_tool.py
------------------
Fact checking tool node implementation using DuckDuckGo search.

This module replaces the Google Custom Search with a native DuckDuckGo
based fact checking pipeline that doesn't require any API keys.

Functions:
    extract_claims_node: Extracts verifiable claims from text using LLM
    plan_searches_node: Generates search queries for each claim
    execute_searches_node: Runs DuckDuckGo searches in parallel
    verify_facts_node: Verifies claims against search results using LLM
"""

import os
import json
import asyncio
from groq import Groq
from langchain_community.tools import DuckDuckGoSearchRun
from app.logging.logging_config import setup_logger
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
search_tool = DuckDuckGoSearchRun()

# Use the same model as other modules
LLM_MODEL = "llama-3.3-70b-versatile"

logger = setup_logger(__name__)


async def extract_claims_node(state):
    """Extract verifiable factual claims from the text."""
    logger.info("--- Fact Check Step 1: Extracting Claims ---")
    try:
        text = state.get("cleaned_text", "")
    
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[
                {
                    "role": "system", 
                    "content": "Extract 2-3 key factual claims. One per line. Be brief."
                },
                {"role": "user", "content": text[:2000]}
            ],
            model=LLM_MODEL,
            temperature=0.0,
            max_tokens=200
        )
        
        raw_content = response.choices[0].message.content
        
        claims = [
            line.strip("- *") 
            for line in raw_content.split("\n") 
            if len(line.strip()) > 10
        ]
        
        logger.info(f"Extracted {len(claims)} claims.")
        return {"claims": claims}
        
    except Exception as e:
        logger.error(f"Error extracting claims: {e}")
        return {"claims": []}


async def plan_searches_node(state):
    """Generate search queries for each claim."""
    logger.info("--- Fact Check Step 2: Planning Searches ---")
    claims = state.get("claims", [])
    
    if not claims:
        return {"search_queries": []}

    claims_text = "\n".join([f"{i}. {c}" for i, c in enumerate(claims)])
    
    prompt = f"""Generate search queries for these claims. Return JSON: {{"searches": [{{"query": "...", "claim_id": 0}}]}}

Claims:
{claims_text}"""

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[{"role": "user", "content": prompt}],
            model=LLM_MODEL,
            temperature=0.0,
            max_tokens=150,
            response_format={"type": "json_object"}
        )
        
        plan_json = json.loads(response.choices[0].message.content)
        queries = plan_json.get("searches", [])
        
        return {"search_queries": queries}

    except Exception as e:
        logger.error(f"Failed to plan searches: {e}")
        return {"search_queries": []}


async def execute_searches_node(state):
    """Execute DuckDuckGo searches in parallel."""
    logger.info("--- Fact Check Step 3: Executing Parallel Searches ---")
    queries = state.get("search_queries", [])
    
    if not queries:
        return {"search_results": []}

    async def run_one_search(q):
        try:
            query_str = q.get("query")
            c_id = q.get("claim_id")
            
            res = await asyncio.to_thread(search_tool.invoke, query_str)
            logger.info(f"Search Result for Claim {c_id}: {res[:200]}...")
            return {"claim_id": c_id, "result": res}
        except Exception as e:
            logger.error(f"Search failed for query: {q.get('query')}: {e}")
            return {"claim_id": q.get("claim_id"), "result": "Search failed"}

    results = await asyncio.gather(*[run_one_search(q) for q in queries])
    
    logger.info(f"Completed {len(results)} searches.")
    return {"search_results": results}


async def verify_facts_node(state):
    """Verify claims against search results using LLM."""
    logger.info("--- Fact Check Step 4: Verifying Facts ---")
    claims = state.get("claims", [])
    results = state.get("search_results", [])
    
    if not claims:
        return {"facts": [], "fact_check_done": True}

    context = "Verify claims:\n"
    for item in results:
        c_id = item["claim_id"]
        if c_id < len(claims):
            # Limit evidence to first 300 chars
            evidence = item['result'][:300] if item.get('result') else 'No evidence'
            context += f"Claim: {claims[c_id]}\nEvidence: {evidence}\n"

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[
                {
                    "role": "system", 
                    "content": "Return JSON: {\"facts\": [{\"claim\": \"...\", \"status\": true/false, \"reason\": \"brief\"}]}"
                },
                {"role": "user", "content": context[:1500]}
            ],
            model=LLM_MODEL,
            temperature=0.0,
            max_tokens=300,
            response_format={"type": "json_object"}
        )
        
        final_verdict_str = response.choices[0].message.content
        
        data = json.loads(final_verdict_str)
        
        facts_list = []
        if isinstance(data, dict):
            # Look for common keys if wrapped
            if "facts" in data:
                facts_list = data["facts"]
            elif "verified_claims" in data:
                facts_list = data["verified_claims"]
            else:
                facts_list = [data]
        elif isinstance(data, list):
            facts_list = data
            
        logger.info(f"Verified {len(facts_list)} facts.")
        return {"facts": facts_list, "fact_check_done": True}

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return {"facts": [], "fact_check_done": True}
