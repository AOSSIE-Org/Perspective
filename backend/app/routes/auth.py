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


def _validate_password_strength(password: str):
    if len(password) < 8:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Password must be at least 8 characters long")


@router.post("/signup")
async def signup(body: SignupRequest):
    _validate_password_strength(body.password)
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
    # Timing attack mitigation:
    # Always perform a password verification step even if user does not exist.
    user = await get_user_by_email(body.email)
    # Pre-generated dummy hash (bcrypt_sha256 of a constant) ensures constant-time path.
    # We generate it lazily to avoid import-time work.
    from app.utils.auth import hash_password as _hp, verify_password as _vp  # local import to avoid circularity
    dummy_hash = _hp("__dummy_constant_password__")
    hashed = user.hashed_password if user else dummy_hash
    password_ok = _vp(body.password, hashed)
    if not user or not password_ok:
        # Return generic error regardless of which check failed
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    token = create_access_token(user.email)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserPublic(**user.model_dump()).model_dump(),
    }
