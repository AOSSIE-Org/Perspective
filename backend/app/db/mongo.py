import os
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase


_client: Optional[AsyncIOMotorClient] = None
_db: Optional[AsyncIOMotorDatabase] = None


def get_mongo_uri() -> str:
    # Expect a MongoDB connection string in environment (Atlas URI)
    return os.getenv("MONGODB_URI", "mongodb://localhost:27017")


def init_mongo(app=None) -> None:
    global _client, _db
    if _client is None:
        uri = get_mongo_uri()
        _client = AsyncIOMotorClient(uri)
        # default database name
        db_name = os.getenv("MONGODB_DB", "perspective")
        _db = _client[db_name]


def close_mongo() -> None:
    global _client
    if _client is not None:
        _client.close()


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        init_mongo()
    return _db
