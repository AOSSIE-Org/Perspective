from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def home():
    return {"message":"Perspective API is live!"}