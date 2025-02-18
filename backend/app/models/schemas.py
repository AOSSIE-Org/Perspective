from pydantic import BaseModel, HttpUrl

class ArticleRequest(BaseModel):
    url: HttpUrl

class ArticleResponse(BaseModel):
    url: HttpUrl
    summary: str
    success: bool

class ScraperRequest(BaseModel):
    url: HttpUrl

class ScraperResponse(BaseModel):
    url: HttpUrl
    content: str
    success: bool
