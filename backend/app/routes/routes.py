from fastapi import APIRouter
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline, run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.chat_graph import send_chat_message
from app.logging.logging_config import setup_logger
import asyncio
import json

logger = setup_logger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class URLRequest(BaseModel):
    url: str


class ProcessRequest(BaseModel):
    """Accepts a URL *and* the LLM provider the user has chosen (BYOK)."""
    url: str
    provider: str = "groq"


class ChatQuery(BaseModel):
    message: str
    thread_id: str
    provider: str = "groq"


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/bias")
async def bias_detection(request: URLRequest):
    content = await asyncio.to_thread(run_scraper_pipeline, request.url)
    bias_result = await asyncio.to_thread(check_bias, content.get("cleaned_text", ""))
    logger.info(f"Bias detection result: {bias_result}")
    return bias_result


@router.post("/process")
async def run_pipelines(request: ProcessRequest):
    """Run the full analysis pipeline.

    The ``provider`` field (``"groq"`` or ``"gemini"``) is forwarded to
    every LLM call inside the LangGraph workflow so the user's chosen
    model is used throughout.
    """
    article_data = await asyncio.to_thread(run_scraper_pipeline, request.url)
    logger.debug(
        f"Scraper output: {json.dumps(article_data, indent=2, ensure_ascii=False)}"
    )

    result = await run_langgraph_workflow(article_data, provider=request.provider)

    # Normalise the perspective object for JSON serialisation
    perspective_obj = result.get("perspective")
    if hasattr(perspective_obj, "model_dump"):
        perspective_data = perspective_obj.model_dump(by_alias=True)
    elif hasattr(perspective_obj, "dict"):
        perspective_data = perspective_obj.dict()
    elif isinstance(perspective_obj, dict):
        perspective_data = perspective_obj
    else:
        perspective_data = {"perspective": str(perspective_obj)}

    return {
        "thread_id": result.get("thread_id", ""),
        "article_summary": result.get("article_summary", ""),
        "web_search_citations": result.get("web_search_citations", []),
        "sentiment": result.get("sentiment", ""),
        "perspective": perspective_data,
        "facts": result.get("facts", []),
        "score": result.get("score", 0),
        "status": result.get("status", "unknown"),
    }


@router.post("/chat")
async def answer_query(request: ChatQuery):
    """Send a follow-up message within an existing analysis thread.

    The ``provider`` field allows the user to switch models mid-conversation.
    """
    try:
        answer = await send_chat_message(
            thread_id=request.thread_id,
            message=request.message,
            provider=request.provider,
        )
        logger.info(f"Chat response for thread {request.thread_id}")
        return {"answer": answer, "thread_id": request.thread_id}
    except Exception as e:
        logger.exception(f"Chat error: {e}")
        return {"error": str(e), "thread_id": request.thread_id}