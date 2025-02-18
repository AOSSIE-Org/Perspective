from fastapi import APIRouter, HTTPException
from app.services.article_service import get_article_summary
from app.models.schemas import ArticleRequest, ArticleResponse

router = APIRouter()

@router.post("/article-summary", response_model=ArticleResponse)
async def get_summary(request: ArticleRequest):
    try:
        summary = await get_article_summary(request.url)
        return ArticleResponse(
            url=request.url,
            summary=summary,
            success=True
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) 