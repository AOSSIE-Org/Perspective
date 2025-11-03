from typing import Optional
from datetime import datetime

from app.models.user import User
from app.db.mongo import get_db


async def get_user_by_email(email: str) -> Optional[User]:
    db = get_db()
    doc = await db.users.find_one({"email": email})
    if not doc:
        return None
    # convert Mongo's _id and possible datetime
    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    return User(**doc)


async def create_user(user: User) -> User:
    db = get_db()
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise ValueError("User with this email already exists")
    payload = user.model_dump()
    # store created_at as datetime
    if isinstance(payload.get("created_at"), str):
        try:
            payload["created_at"] = datetime.fromisoformat(payload["created_at"])
        except Exception:
            payload["created_at"] = datetime.utcnow()
    result = await db.users.insert_one(payload)
    payload["id"] = str(result.inserted_id)
    return User(**payload)
