from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from app.scrapers.article_scraper import scrape_website
from app.scrapers.clean_data import clean_scraped_data
from app.services.summarization_service import summarize_text
import json
from app.services.counter_service import generate_opposite_perspective
import logging
from typing import List, Optional
import uuid
from sqlalchemy.orm import Session
from app.services.related_topics import generate_related_topics
from app.services.chat_manager import chat_manager
from app.utils.machine_id import get_machine_id

router = APIRouter()
logger = logging.getLogger("uvicorn.error")

class ArticleRequest(BaseModel):
    summary: str  # summarized article text to generate opposite perspective


class ScrapURLRequest(BaseModel):
    url: str  # URL to scrape data from


class RelatedTopicsRequest(BaseModel):
    summary: str  # Ensure this matches the frontend's request

class RelatedContext(BaseModel):
    summary: str
    perspective: str
    question: str

class InitializeChatRequest(BaseModel):
    url: str
    summary: str
    perspective: str
    machine_id: str

class ChatRequest(BaseModel):
    url: str
    question: str
    thread_id: Optional[str] = None
    machine_id: str

class ChatHistoryRequest(BaseModel):
    url: str
    machine_id: str  # Only required for chat history


@router.post("/generate-perspective")
def generate_ai_perspective(request: ArticleRequest):
    try:
        new_perspective = generate_opposite_perspective(request.summary)
        logger.info("Generated perspective: %s", new_perspective)
        return {"perspective": new_perspective}
    except Exception as e:
        logger.error("Error in generate-perspective: %s", e)
        raise HTTPException(
            status_code=500, detail="Error generating perspective")


@router.post("/scrape-and-summarize")
async def scrape_article(article: ScrapURLRequest):
    print("huhuh")
    try:
        if not article.url:
            raise HTTPException(status_code=422, detail="URL is required")

        # Scrape the website
        print(article.url)
        data = scrape_website(article.url)
        if data is None:
            logger.error("Scraped data is None for URL: %s", article.url)
            raise HTTPException(
                status_code=500, detail="Error scraping the article. No data returned.")
        logger.info("Scraped data: %s", data)

        # Clean the data (make sure data is a string)
        clean = clean_scraped_data(data)
        print("Cleaned data: %s", clean)

        # Summarize the text
        summary = summarize_text({"inputs": clean})
        print("Summary output: %s", summary)

        # Return summary directly (assuming it's a JSON-serializable object)
        return {"summary": summary}
    except Exception as e:
        logger.error("Error in scrape-and-summarize: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail="Error processing the URL")


@router.post("/related-topics")
async def get_related_topics(request: RelatedTopicsRequest):
    related_topics = generate_related_topics(request.summary)
    return {"topics": related_topics}

@router.post("/initialize-chat")
async def initialize_chat(request: InitializeChatRequest):
    """Initialize a new chat session."""
    return chat_manager.initialize_chat(
        request.url,
        request.summary,
        request.perspective,
        request.machine_id
    )

@router.post("/chat")
async def chat(request: ChatRequest):
    """Get response for a chat message."""
    return chat_manager.get_chat_response(
        request.url,
        request.question,
        request.thread_id,
        request.machine_id
    )

@router.post("/chat-history")
async def get_chat_history(request: ChatHistoryRequest):
    """Get chat history for the current machine and URL."""
    if not request.machine_id:
        raise HTTPException(
            status_code=400,
            detail="Machine ID is required for chat history"
        )
    return chat_manager.get_chat_history(request.url, request.machine_id)

