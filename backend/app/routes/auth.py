from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from app.models.user import User, UserCreate, UserPublic
from app.db.user_store import get_user_by_email, create_user
from app.utils.auth import hash_password, verify_password, create_access_token


router = APIRouter()


class SignupRequest(UserCreate):
    pass


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


@router.post("/signup")
async def signup(body: SignupRequest):
    existing = await get_user_by_email(body.email)
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    user = User(name=body.name, email=body.email, hashed_password=hash_password(body.password))
    user = await create_user(user)
    token = create_access_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic(**user.model_dump()).model_dump(),
    }


@router.post("/login")
async def login(body: LoginRequest):
    user = await get_user_by_email(body.email)
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic(**user.model_dump()).model_dump(),
    }
