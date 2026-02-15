from pydantic import BaseModel, Field
from typing import Any, Dict, Optional

class LLMResponse(BaseModel):
    """
    Standardized response object for all LLM providers.
    """
    content: str
    raw_response: Any = Field(default=None, description="The raw response object from the provider")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Usage stats, finish reason, etc.")
