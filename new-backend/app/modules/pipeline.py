from app.modules.scraper.extractor import Article_extractor
from app.modules.scraper.cleaner import clean_extracted_text
from app.modules.scraper.keywords import extract_keywords
from app.modules.langgraph_builder import build_langgraph
# from app.modules.facts_check.llm_processing import run_claim_extractor_sdk
# from app.modules.facts_check.llm_processing import run_fact_verifier_sdk
# from app.modules.facts_check.web_search import search_duckduckgo
import json
# import re
# import time

# Compile once when module loads
_LANGGRAPH_WORKFLOW = build_langgraph()


def run_scraper_pipeline(url: str) -> dict:
    extractor = Article_extractor(url)
    raw_text = extractor.extract()

    # Clean the text
    result = {}
    cleaned_text = clean_extracted_text(raw_text["text"])
    result["cleaned_text"] = cleaned_text

    # Extract keywords
    keywords = extract_keywords(cleaned_text)
    result["keywords"] = keywords

    # Optional: pretty print raw_text for debugging
    print(json.dumps(result, indent=2, ensure_ascii=False))

    return result


def run_langgraph_workflow(state: dict):
    """Execute the pre-compiled LangGraph workflow."""
    result = _LANGGRAPH_WORKFLOW.invoke(state)
    return result


# def run_fact_check_pipeline(state):

#     result = run_claim_extractor_sdk(state)
#     # Step 1: Extract claims
#     raw_output = result["verifiable_claims"]

#     # Match any line that starts with *, -, or • followed by text
#     claims = re.findall(r"^[\*\-•]\s+(.*)", raw_output, re.MULTILINE)
#     claims = [claim.strip() for claim in claims if claim.strip()]

#     # Step 2: Search each claim with polite delay
#     search_results = []
#     for claim in claims:
#         print(f"\n🔍Searching for claim...: {claim}")
#         try:
#             val = search_duckduckgo(claim)
#             val[0]["claim"] = claim
#             search_results.append(val[0])
#         except Exception as e:
#             print(f"❌ Search failed for: {claim} -> {e}")
#         time.sleep(4)  # Add 4 second delay to prevent rate-limit

#     final = run_fact_verifier_sdk(search_results)
#     return final["verifications"]
