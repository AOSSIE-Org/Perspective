# backend/app/models/schemas.py
from pydantic import BaseModel

class FactCheckRequest(BaseModel):
    url: str  # URL provided by the user

class FactCheckResult(BaseModel):
    claim: str
    verdict: str  # e.g. "FACT", "MISINFORMATION", or error messages
    evidence: str
