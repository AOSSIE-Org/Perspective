"""
chunk_rag_data.py
-----------------
Module for converting processed article data into smaller, structured
chunks suitable for storage and retrieval in a vector database.

The chunking process:
    1. Validates the presence of required top-level fields such as
       cleaned_text, perspective, and facts.
    2. Assigns a unique article ID to all chunks using a hash-based
       generator.
    3. Creates a "counter-perspective" chunk containing the alternative
       viewpoint and its reasoning.
    4. Splits each fact into its own chunk, including metadata like
       verdict, explanation, and source link.

This structure enables more efficient semantic search, targeted
retrieval, and fine-grained analysis.

Functions:
    chunk_rag_data(data: dict) -> list[dict]
        Validates and transforms the input data into a list of
        chunk dictionaries containing text and metadata.
"""


from app.utils.generate_chunk_id import generate_id
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def chunk_rag_data(data):
    try:
        required_fields = ["cleaned_text", "perspective", "facts"]
        for field in required_fields:
            if field not in data:
                if field == "facts":
                    data["facts"] = []
                else:
                    raise ValueError(f"Missing required field: {field}")

        if not isinstance(data["facts"], list):
            logger.warning("Facts is not a list. Treating as empty.")
            data["facts"] = []

        article_id = generate_id(data["cleaned_text"])
        chunks = []

        perspective_data = data["perspective"]
        
        if hasattr(perspective_data, "dict"):
            p_data = perspective_data.dict()
        elif hasattr(perspective_data, "model_dump"):
            p_data = perspective_data.model_dump()
        elif isinstance(perspective_data, dict):
            p_data = perspective_data
        else:
            p_data = {
                "perspective": getattr(perspective_data, "perspective", ""),
                "reasoning": getattr(perspective_data, "reasoning", "")
            }

        p_text = p_data.get("perspective", "")
        raw_reasoning = p_data.get("reasoning", "")
        if isinstance(raw_reasoning, list):
            p_reason = "\n".join(raw_reasoning)
        else:
            p_reason = str(raw_reasoning)

        if p_text:
            chunks.append({
                "id": f"{article_id}-perspective",
                "text": p_text,
                "metadata": {
                    "type": "counter-perspective",
                    "reasoning": p_reason,
                    "article_id": article_id,
                },
            })

        for i, fact in enumerate(data["facts"]):
            claim_text = fact.get("claim", fact.get("original_claim", ""))
            verdict = fact.get("status", fact.get("verdict", "Unverified"))
            explanation = fact.get("reason", fact.get("explanation", "No explanation provided"))
            source = fact.get("source_link", "N/A")

            # SKIP invalid facts instead of Crashing
            if not claim_text:
                logger.warning(f"Skipping fact index {i}: Missing claim text.")
                continue

            chunks.append({
                "id": f"{article_id}-fact-{i}",
                "text": claim_text,
                "metadata": {
                    "type": "fact",
                    "verdict": verdict,
                    "explanation": explanation,
                    "source_link": source,
                    "article_id": article_id,
                },
            })

        logger.info(f"Generated {len(chunks)} chunks for storage.")
        return chunks

    except Exception as e:
        logger.exception(f"Failed to chunk the data: {e}")
        return []