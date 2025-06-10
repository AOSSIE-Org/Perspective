from fastapi import APIRouter
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
import json

router = APIRouter()


class URlRequest(BaseModel):
    url: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/process")
async def run_pipelines(request: URlRequest):
    """
    Processes a URL by extracting article text and running a language workflow.
    
    Accepts a request containing a URL, extracts the article text using a scraper pipeline,
    and processes the extracted text through a language workflow. Returns the result of the workflow.
    """
    article_text = run_scraper_pipeline(request.url)
    print(json.dumps(article_text, indent=2))
    data = run_langgraph_workflow(article_text)
    return data
