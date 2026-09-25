"""
fact_check_utils.py
-------------------
Provides a parallelized pipeline for automated fact-checking of extracted claims from article content.
"""

from app.modules.facts_check.web_search import search_google
from app.modules.facts_check.llm_processing import (
    run_claim_extractor_sdk,
    run_fact_verifier_sdk,
)
from app.logging.logging_config import setup_logger
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

logger = setup_logger(__name__)


def _search_single_claim(claim: str):
    logger.info(f"[SEARCH] Querying: {claim[:80]}...")
    try:
        results = search_google(claim)
        if results:
            results[0]["claim"] = claim
            logger.info(f"[FOUND] {results[0].get('title', 'Result')[:80]}")
            return results[0]
    except Exception as e:
        logger.warning(f"[SEARCH ERROR] {claim[:50]} -> {e}")
    return None


def run_fact_check_pipeline(state):
    result = run_claim_extractor_sdk(state)

    if state.get("status") != "success":
        logger.error("[ERROR] Claim extraction failed.")
        return [], "Claim extraction failed."

    # Step 1: Extract claims supporting all list formats (1., -, *, •, or plain non-empty lines)
    raw_output = result.get("verifiable_claims", "")
    lines = raw_output.strip().split("\n")
    claims = []

    for line in lines:
        cleaned = re.sub(r"^(?:(?:\d+[\.\)]|\*|\-|•)\s*)", "", line.strip()).strip()
        # Filter out meta headers and very short strings
        if len(cleaned) > 15 and not cleaned.lower().startswith(("here are", "extracted claim", "verifiable claim")):
            claims.append(cleaned)

    # If regex/line splitting missed, fallback to top sentences from cleaned_text
    if not claims:
        text = state.get("cleaned_text", "")
        sentences = [s.strip() for s in re.split(r"[.!?]\s+", text) if len(s.strip()) > 25]
        claims = sentences[:3]
        logger.info(f"[CLAIMS FALLBACK] Using {len(claims)} sentences as claims: {claims}")
    else:
        logger.info(f"[CLAIMS] Extracted {len(claims)} claims: {claims}")

    if not claims:
        return [], "No verifiable claims found."

    # Limit to top 3 claims for fast verification
    claims = claims[:3]

    # Step 2: Search claims in parallel (max 3 concurrent), preserving extracted order
    search_results = [None] * len(claims)
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_index = {executor.submit(_search_single_claim, claim): i for i, claim in enumerate(claims)}
        for future in as_completed(future_to_index):
            idx = future_to_index[future]
            res = future.result()
            if res:
                search_results[idx] = res

    # Remove unfilled slots; if nothing found, return early without fabricated evidence
    search_results = [r for r in search_results if r is not None]

    if not search_results:
        logger.warning("[WARNING] All searches returned empty; skipping fact verification.")
        return [], "No search results available for fact verification."

    # Step 3: Verify facts using LLM
    final = run_fact_verifier_sdk(search_results)
    return final.get("verifications", []), None
