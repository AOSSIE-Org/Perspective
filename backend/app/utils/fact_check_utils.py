"""
fact_check_utils.py
-------------------
Enhanced fact-checking pipeline with:
    - Multi-result search evidence (up to 3 sources per claim)
    - Polite delay between searches to avoid rate limiting
    - Source credibility scores surfaced in verifications
    - Graceful partial failure (one claim failure doesn't stop others)
"""

import time
from app.modules.facts_check.web_search import search_google
from app.modules.facts_check.llm_processing import (
    run_claim_extractor_sdk,
    run_fact_verifier_sdk,
)
from app.logging.logging_config import setup_logger
import re

logger = setup_logger(__name__)

# Polite delay between DuckDuckGo queries (seconds) to avoid rate limiting
_SEARCH_DELAY = 1.2
# Max claims to fact-check per article (avoid excessive API usage)
_MAX_CLAIMS = 5


def run_fact_check_pipeline(state: dict):
    """
    Run the full fact-checking pipeline:
      1. Extract verifiable claims from the article text
      2. Search each claim with DuckDuckGo (up to 3 sources)
      3. Verify each claim against the gathered evidence using LLM
    Returns: (list[verification_result], error_string | None)
    """
    result = run_claim_extractor_sdk(state)

    if result.get("status") != "success":
        logger.error("Claim extraction failed.")
        return [], "Claim extraction failed."

    # Step 1: Parse extracted claims
    raw_output = result.get("verifiable_claims", "")
    claims = re.findall(r"^[\*\-•]\s+(.*)", raw_output, re.MULTILINE)
    claims = [c.strip() for c in claims if c.strip()]
    logger.info(f"Extracted {len(claims)} claims for fact-checking")

    if not claims:
        return [], "No verifiable claims found."

    # Cap to avoid excessive LLM usage
    claims = claims[:_MAX_CLAIMS]

    # Step 2: Search each claim — gather multi-source evidence
    search_results = []
    for i, claim in enumerate(claims):
        logger.info(f"Searching claim {i + 1}/{len(claims)}: {claim[:60]}")
        try:
            results = search_google(claim, max_results=3)
            if results:
                # Pass the best result as primary, attach credibility info
                primary = results[0]
                primary["claim"] = claim
                primary["all_sources"] = [
                    {
                        "title": r["title"],
                        "link": r["link"],
                        "credibility": r["credibility"],
                    }
                    for r in results
                ]
                search_results.append(primary)
                logger.info(
                    f"Found {len(results)} sources. Best: {primary['title'][:50]} "
                    f"(credibility={primary['credibility']})"
                )
            else:
                logger.warning(f"No search results for claim: {claim[:60]}")
        except Exception as e:
            logger.error(f"Search failed for claim '{claim[:40]}': {e}")

        # Polite delay between searches
        if i < len(claims) - 1:
            time.sleep(_SEARCH_DELAY)

    if not search_results:
        return [], "All claim searches failed or returned no results."

    # Step 3: LLM verification
    final = run_fact_verifier_sdk(search_results)
    verifications = final.get("verifications", [])

    # Attach source credibility scores to each verified claim
    cr_map = {sr["claim"]: sr.get("all_sources", []) for sr in search_results}
    for v in verifications:
        claim_text = v.get("original_claim", "")
        v["sources"] = cr_map.get(claim_text, [])

    return verifications, None
