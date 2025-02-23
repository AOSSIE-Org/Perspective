from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter()

class ArticleRequest(BaseModel):
    text: str  #  cleaned article text to summarize

class ScrapURLRequest(BaseModel):
    url: str  #  URL to scrape data from

@router.post("/article-summary")
def summarize_article(request: ArticleRequest):
    # returns summarized text of the article
    return {"summary": "Summarized text of article."}

@router.post("/scrap-url")
def scrap_url(request: ScrapURLRequest):
    # returns Scraped and Cleaned data of the article.
    return {"scraped_data": "Scraped and cleaned data from article."}