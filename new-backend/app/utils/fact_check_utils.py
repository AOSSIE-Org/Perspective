from app.modules.facts_check.web_search import search_duckduckgo
from app.modules.facts_check.llm_processing import run_claim_extractor_sdk
from app.modules.facts_check.llm_processing import run_fact_verifier_sdk
import re
import time


def run_fact_check_pipeline(state):

    result = run_claim_extractor_sdk(state)
    # Step 1: Extract claims
    raw_output = result["verifiable_claims"]

    # Match any line that starts with *, -, or • followed by text
    claims = re.findall(r"^[\*\-•]\s+(.*)", raw_output, re.MULTILINE)
    claims = [claim.strip() for claim in claims if claim.strip()]

    # Step 2: Search each claim with polite delay
    search_results = []
    for claim in claims:
        print(f"\n🔍Searching for claim...: {claim}")
        try:
            val = search_duckduckgo(claim)
            val[0]["claim"] = claim
            search_results.append(val[0])
        except Exception as e:
            print(f"❌ Search failed for: {claim} -> {e}")
        time.sleep(4)  # Add 4 second delay to prevent rate-limit

    final = run_fact_verifier_sdk(search_results)
    return final["verifications"]
