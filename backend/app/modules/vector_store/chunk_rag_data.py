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


from typing import Any, Dict, List, Mapping
from app.utils.generate_chunk_id import generate_id
from app.logging.logging_config import setup_logger

logger = setup_logger(__name__)


def chunk_rag_data(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Validate and transform processed article data into structured RAG vector chunks.

    Args:
        data: A dictionary containing 'cleaned_text', 'perspective', and 'facts'.
            The 'perspective' field can be a dictionary, a Pydantic model, or an object
            with 'perspective' and 'reasoning' attributes. The 'facts' field must be a list
            of dictionaries or models containing 'original_claim', 'verdict', 'explanation',
            and 'source_link'.

    Returns:
        A list of chunk dictionaries with 'id', 'text', and 'metadata'.

    Raises:
        ValueError: If input data or required fields are missing, invalid, or malformed.
    """
    try:
        if not isinstance(data, Mapping):
            raise ValueError("Input data must be a dictionary or mapping")

        # Validate required top-level fields
        required_fields = ["cleaned_text", "perspective", "facts"]
        for field in required_fields:
            if field not in data or data[field] is None:
                raise ValueError(f"Missing required field: {field}")

        cleaned_text = data["cleaned_text"]
        if not isinstance(cleaned_text, str) or not cleaned_text.strip():
            raise ValueError("cleaned_text must be a non-empty string")

        if not isinstance(data["facts"], list):
            raise ValueError("Facts must be a list")

        # Validate and extract perspective structure polymorphically
        perspective_raw = data["perspective"]
        if hasattr(perspective_raw, "model_dump"):
            perspective_dict = perspective_raw.model_dump()
        elif hasattr(perspective_raw, "dict"):
            perspective_dict = perspective_raw.dict()
        elif isinstance(perspective_raw, Mapping):
            perspective_dict = perspective_raw
        else:
            perspective_dict = None

        if perspective_dict is not None:
            perspective_text = perspective_dict.get("perspective")
            reasoning_text = perspective_dict.get("reasoning")
        else:
            perspective_text = getattr(perspective_raw, "perspective", None)
            reasoning_text = getattr(perspective_raw, "reasoning", None)

        if not perspective_text or not reasoning_text:
            raise ValueError(
                "Perspective object missing required fields: 'perspective' and 'reasoning'"
            )

        if not isinstance(perspective_text, str) or not isinstance(reasoning_text, str):
            raise ValueError("Perspective and reasoning must be strings")

        article_id = generate_id(cleaned_text)
        chunks: List[Dict[str, Any]] = []

        # Add counter-perspective chunk
        chunks.append(
            {
                "id": f"{article_id}-perspective",
                "text": perspective_text.strip(),
                "metadata": {
                    "type": "counter-perspective",
                    "reasoning": reasoning_text.strip(),
                    "article_id": article_id,
                },
            }
        )

        # Add each fact as a separate chunk
        for i, fact in enumerate(data["facts"]):
            if hasattr(fact, "model_dump"):
                fact_dict = fact.model_dump()
            elif hasattr(fact, "dict"):
                fact_dict = fact.dict()
            elif isinstance(fact, Mapping):
                fact_dict = fact
            else:
                raise ValueError(f"Fact at index {i} must be a dictionary or mapping")

            fact_fields = ["original_claim", "verdict", "explanation", "source_link"]
            for field in fact_fields:
                if field not in fact_dict or fact_dict[field] is None:
                    raise ValueError(
                        f"Missing required fact field: '{field}' in fact index {i}"
                    )

            chunks.append(
                {
                    "id": f"{article_id}-fact-{i}",
                    "text": str(fact_dict["original_claim"]).strip(),
                    "metadata": {
                        "type": "fact",
                        "verdict": str(fact_dict["verdict"]).strip(),
                        "explanation": str(fact_dict["explanation"]).strip(),
                        "source_link": str(fact_dict["source_link"]).strip(),
                        "article_id": article_id,
                    },
                }
            )

        return chunks

    except Exception as e:
        logger.exception(f"Failed to chunk the data: {e}")
        raise
