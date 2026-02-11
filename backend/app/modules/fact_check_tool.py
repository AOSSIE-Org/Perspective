"""
fact checking tool node implementation to replace the google search

"""

import os
import json
import asyncio
from groq import Groq
from langchain_community.tools import DuckDuckGoSearchRun
from app.logging.logging_config import setup_logger
from dotenv import load_dotenv
from app.llm_config import LLM_MODEL

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))
search_tool = DuckDuckGoSearchRun()

logger = setup_logger(__name__)

async def extract_claims_node(state):
    logger.info("--- Fact Check Step 1: Extracting Claims ---")
    try:
        text = state.get("cleaned_text", "")
    
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[
                {
                    "role": "system", 
                    "content": "Extract specific, verifiable factual claims from the text. Ignore opinions. Return a simple list of strings, one per line."
                },
                {"role": "user", "content": text[:4000]}
            ],
            model=LLM_MODEL,
            temperature=0.0
        )
        
        raw_content = response.choices[0].message.content
        
        claims = [line.strip("- *") for line in raw_content.split("\n") if len(line.strip()) > 10]
        
        logger.info(f"Extracted {len(claims)} claims.")
        return {"claims": claims}
        
    except Exception as e:
        logger.error(f"Error extraction claims: {e}")
        return {"claims": []}

async def plan_searches_node(state):
    logger.info("--- Fact Check Step 2: Planning Searches ---")
    claims = state.get("claims", [])
    
    if not claims:
        return {"search_queries": []}

    claims_text = "\n".join([f"{i}. {c}" for i, c in enumerate(claims)])
    
    prompt = f"""
    You are a search query generator.
    For each claim, generate a search query to verify it.
    
    Output MUST be valid JSON in this format:
    {{
        "searches": [
            {{"query": "search query 1", "claim_id": 0}},
            {{"query": "search query 2", "claim_id": 1}}
        ]
    }}

    Claims:
    {claims_text}
    """

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[{"role": "user", "content": prompt}],
            model=LLM_MODEL,
            temperature=0.0,
            response_format={"type": "json_object"}
        )
        
        plan_json = json.loads(response.choices[0].message.content)
        queries = plan_json.get("searches", [])
        
        return {"search_queries": queries}

    except Exception as e:
        logger.error(f"Failed to plan searches: {e}")
        return {"search_queries": []}

async def execute_searches_node(state):
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
            return {"claim_id": q.get("claim_id"), "result": "Search failed"}

    results = await asyncio.gather(*[run_one_search(q) for q in queries])
    
    logger.info(f"Completed {len(results)} searches.")
    return {"search_results": results}

async def verify_facts_node(state):
    logger.info("--- Fact Check Step 4: Verifying Facts ---")
    claims = state.get("claims", [])
    results = state.get("search_results", [])
    
    if not claims:
        return {"facts": [], "fact_check_done": True}

    context = "Verify these claims based on the search results:\n"
    for item in results:
        c_id = item["claim_id"]
        if c_id < len(claims):
            context += f"\nClaim: {claims[c_id]}\nEvidence: {item['result']}\n"

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            messages=[
                {
                    "role": "system", 
                    "content": "You are a strict fact checker. Return a JSON list of objects with keys: 'claim', 'status' (True/False/Unverified), and 'reason'."
                },
                {"role": "user", "content": context}
            ],
            model=LLM_MODEL,
            temperature=0.0,
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
            
        return {"facts": facts_list, "fact_check_done": True}

    except Exception as e:
        logger.error(f"Verification failed: {e}")
        return {"facts": [], "fact_check_done": True}