from fastapi import FastAPI
from app.routes import router
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Perspective AI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

@app.get("/")
def home():
    return {"message": "Welcome to the Perspective AI"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
