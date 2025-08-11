from fastapi import APIRouter
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
from app.modules.bias_detection.check_bias import check_bias
from app.modules.chat.get_rag_data import search_pinecone
from app.modules.chat.llm_processing import ask_llm
import asyncio
import json

router = APIRouter()


class URlRequest(BaseModel):
    url: str


class ChatQuery(BaseModel):
    message: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/bias")
async def bias_detection(request: URlRequest):
    content = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    bias_score = await asyncio.to_thread(check_bias, (content))
    print(bias_score)
    return bias_score


@router.post("/process")
async def run_pipelines(request: URlRequest):
    article_text = await asyncio.to_thread(run_scraper_pipeline, (request.url))
    print(json.dumps(article_text, indent=2))
    data = await asyncio.to_thread(run_langgraph_workflow, (article_text))
    return data


@router.post("/chat")
async def answer_query(request: ChatQuery):
    query = request.message
    results = search_pinecone(query)
    answer = ask_llm(query, results)
    print(answer)

    return {"answer": answer}
