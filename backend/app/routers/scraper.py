from fastapi import APIRouter, HTTPException
from app.services.scraper_service import scrape_url
from app.models.schemas import ScraperRequest, ScraperResponse

router = APIRouter()

@router.post("/scrape-url", response_model=ScraperResponse)
async def scrape_article(request: ScraperRequest):
    try:
        content = await scrape_url(request.url)
        return ScraperResponse(
            url=request.url,
            content=content,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 