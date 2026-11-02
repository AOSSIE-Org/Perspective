"""
routes.py
---------
Defines the FastAPI API routes for the Perspective application, exposing endpoints
for bias detection, article processing, and chat-based querying over stored RAG data.

Endpoints:
    GET /
        Health check endpoint confirming the API is live.

    POST /bias
        Accepts a URL, scrapes and processes the article content, and runs bias detection
        to return a bias score and related insights.

    POST /process
        Accepts a URL, scrapes and processes the article content, then executes the
        LangGraph workflow for sentiment analysis, fact-checking, perspective generation,
        and final result assembly.

    POST /chat
        Accepts a user query, searches stored vector data in Pinecone, and queries an LLM
        to produce a contextual answer.

Core Components:
    - run_scraper_pipeline: Extracts and cleans article text, then identifies keywords.
    - run_langgraph_workflow: Executes the LangGraph pipeline for deep content analysis.
    - check_bias: Scores and analyzes potential bias in article content.
    - search_pinecone: Retrieves relevant RAG data for a given query.
    - ask_llm: Generates a natural language answer using retrieved context.
"""

from fastapi import APIRouter
from pydantic import BaseModel, Field, HttpUrl, field_validator
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.get_rag_data import search_pinecone
from app.modules.chat.llm_processing import ask_llm
from app.logging.logging_config import setup_logger
import asyncio
import json

logger = setup_logger(__name__)

router = APIRouter()


class URlRequest(BaseModel):
    """
    Request model for endpoints that accept an article URL.

    Attributes:
        url (HttpUrl): Valid HTTP or HTTPS URL of the article to process.
    """

    url: HttpUrl


class ChatQuery(BaseModel):
    """
    Request model for the chat endpoint.

    Attributes:
        message (str): Non-empty user query or message for RAG search.
    """

    message: str = Field(..., min_length=1)

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        """
        Validates that the query message contains non-whitespace characters.

        Args:
            v (str): Input message string.

        Returns:
            str: Trimmed message string.

        Raises:
            ValueError: If the message is empty or whitespace-only.
        """
        if not v.strip():
            raise ValueError("Message cannot be empty or whitespace")
        return v.strip()


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/bias")
async def bias_detection(request: URlRequest):
    content = await asyncio.to_thread(run_scraper_pipeline, str(request.url))
    bias_score = await asyncio.to_thread(check_bias, content)
    logger.info(f"Bias detection result: {bias_score}")
    return bias_score


@router.post("/process")
async def run_pipelines(request: URlRequest):
    article_text = await asyncio.to_thread(run_scraper_pipeline, str(request.url))
    logger.debug(
        f"Scraper output: {json.dumps(article_text, indent=2, ensure_ascii=False)}"
    )
    data = await asyncio.to_thread(run_langgraph_workflow, article_text)
    return data


@router.post("/chat")
async def answer_query(request: ChatQuery):
    query = request.message
    results = search_pinecone(query)
    answer = ask_llm(query, results)
    logger.info(f"Chat answer generated: {answer}")

    return {"answer": answer}
