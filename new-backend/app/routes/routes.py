from fastapi import APIRouter
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline
import json

router = APIRouter()


class URlRequest(BaseModel):
    url: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}


@router.post("/process")
async def run_pipelines(request: URlRequest):
    article_text = run_scraper_pipeline(request.url)
    print(json.dumps(article_text, indent=2))
    return article_text
