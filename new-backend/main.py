from fastapi import FastAPI
from app.routes.routes import router as article_router


app = FastAPI(
    title="Perspective API",
    version="1.0.0",
    description="An API to generate alternative perspectives on biased articles"
)

app.include_router(article_router,prefix="/api",tags=["Articles"])


if __name__ == "__main__":
    import uvicorn
    print("server is running on http://localhost:8000/api")
    uvicorn.run("main:app",host="0.0.0.0",port=8000,reload=True)
   
