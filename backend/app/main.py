from fastapi import FastAPI
from app.routes import router
import uvicorn

app = FastAPI(title="Perspective AI", version="1.0.0")

# Include routes from routes.py
app.include_router(router)

# Root endpoint (optional)
@app.get("/")
def home():
    return {"message": "Welcome to the Perspective AI"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)