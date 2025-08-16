"""
fact_check_utils.py
-------------------
Provides a pipeline for automated fact-checking of extracted claims from article content.
The process integrates claim extraction, web search, and large language model (LLM) 
verification to produce a structured set of fact verification results.

Pipeline Steps:
    1. Claim Extraction:
        - Uses the `run_claim_extractor_sdk` to identify verifiable claims from the
          provided article state.
        - Claims are parsed from markdown-like bullet point output.

    2. Web Search:
        - For each extracted claim, executes a Google search via `search_google` to find
          relevant supporting or refuting sources.
        - Stores the top search result along with the associated claim.
        - Implements basic error handling and skips claims with no search results.

    3. Fact Verification:
        - Passes search results to `run_fact_verifier_sdk` for LLM-based evaluation.
        - Produces verdicts and explanations for each claim.

Returns:
    - A list of verification objects containing verdicts, reasoning, and source metadata.
    - An error message if the process fails at any stage.

Usage:
    final_results, error = run_fact_check_pipeline(state)
"""


from app.modules.facts_check.web_search import search_google
from app.modules.facts_check.llm_processing import (
    run_claim_extractor_sdk,
    run_fact_verifier_sdk,
)
from app.logging.logging_config import setup_logger
import re

logger = setup_logger(__name__)


def run_fact_check_pipeline(state):
    result = run_claim_extractor_sdk(state)

    if state.get("status") != "success":
        logger.error("❌ Claim extraction failed.")
        return [], "Claim extraction failed."

    # Step 1: Extract claims
    raw_output = result.get("verifiable_claims", "")
    claims = re.findall(r"^[\*\-•]\s+(.*)", raw_output, re.MULTILINE)
    claims = [claim.strip() for claim in claims if claim.strip()]
    logger.info(f"🧠 Extracted claims: {claims}")

    if not claims:
        return [], "No verifiable claims found."

    # Step 2: Search each claim with polite delay
    search_results = []
    for claim in claims:
        logger.info(f"\n🔍 Searching for claim: {claim}")
        try:
            results = search_google(claim)
            if results:
                results[0]["claim"] = claim
                search_results.append(results[0])
                logger.info(f"✅ Found result: {results[0]['title']}")
            else:
                logger.warning(f"⚠️ No search result for: {claim}")
        except Exception as e:
            logger.error(f"❌ Search failed for: {claim} -> {e}")

    if not search_results:
        return [], "All claim searches failed or returned no results."

    # Step 3: Verify facts using LLM
    final = run_fact_verifier_sdk(search_results)
    return final.get("verifications", []), None
