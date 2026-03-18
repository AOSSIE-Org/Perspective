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

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, HttpUrl, Field, validator
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


class URLRequest(BaseModel):
    url: HttpUrl  # Validates URL format automatically, returns 422 for invalid URLs

class ChatQuery(BaseModel):
    message: str = Field(..., min_length=1, strip_whitespace=True)  # Rejects empty/whitespace

    @validator('message')
    def message_must_not_be_blank(cls, v):
        if not v.strip():
            raise ValueError('Message cannot be empty or whitespace')
        return v


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/bias")
async def bias_detection(request: URLRequest):
    try:
        content = await asyncio.to_thread(run_scraper_pipeline, (str(request.url)))
        bias_score = await asyncio.to_thread(check_bias, (content))
        logger.info(f"Bias detection result: {bias_score}")
        return bias_score
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise  # Let global handler in main.py catch it with trace_id


@router.post("/process")
async def run_pipelines(request: URLRequest):
    try:
        article_text = await asyncio.to_thread(run_scraper_pipeline, (str(request.url)))
        logger.debug(f"Scraper output: {json.dumps(article_text, indent=2, ensure_ascii=False)}")
        data = await asyncio.to_thread(run_langgraph_workflow, (article_text))
        return data
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise  # Let global handler in main.py catch it with trace_id


@router.post("/chat")
async def answer_query(request: ChatQuery):
    try:
        query = request.message
        results = search_pinecone(query)
        answer = ask_llm(query, results)
        logger.info(f"Chat answer generated: {answer}")
        return {"answer": answer}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception:
        raise
        
