from fastapi import APIRouter
from pydantic import BaseModel
from app.modules.pipeline import run_scraper_pipeline
from app.modules.pipeline import run_langgraph_workflow
import json
from app.modules.bias_detection.check_bias import check_bias

router = APIRouter()


class URlRequest(BaseModel):
    url: str


@router.get("/")
async def home():
    return {"message": "Perspective API is live!"}

@router.post("/bias")
async def bias_detection(request: URlRequest):
    content = run_scraper_pipeline(request.url)
    bias_score = check_bias(content)
    print(bias_score)
    return bias_score
    


@router.post("/process")
async def run_pipelines(request: URlRequest):
    article_text = run_scraper_pipeline(request.url)
    print(json.dumps(article_text, indent=2))
    data = run_langgraph_workflow(article_text)
    return data
