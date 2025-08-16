from app.modules.facts_check.web_search import search_google
from app.modules.facts_check.llm_processing import (
    run_claim_extractor_sdk,
    run_fact_verifier_sdk,
)
import re
import time


def run_fact_check_pipeline(state):
    result = run_claim_extractor_sdk(state)

    if state.get("status") != "success":
        print("❌ Claim extraction failed.")
        return [], "Claim extraction failed."

    # Step 1: Extract claims
    raw_output = result.get("verifiable_claims", "")
    claims = re.findall(r"^[\*\-•]\s+(.*)", raw_output, re.MULTILINE)
    claims = [claim.strip() for claim in claims if claim.strip()]
    print(f"🧠 Extracted claims: {claims}")

    if not claims:
        return [], "No verifiable claims found."

    # Step 2: Search each claim with polite delay
    search_results = []
    for claim in claims:
        print(f"\n🔍 Searching for claim: {claim}")
        try:
            results = search_google(claim)
            if results:
                results[0]["claim"] = claim
                search_results.append(results[0])
                print(f"✅ Found result: {results[0]['title']}")
            else:
                print(f"⚠️ No search result for: {claim}")
        except Exception as e:
            print(f"❌ Search failed for: {claim} -> {e}")

    if not search_results:
        return [], "All claim searches failed or returned no results."

    # Step 3: Verify facts using LLM
    final = run_fact_verifier_sdk(search_results)
    return final.get("verifications", []), None
