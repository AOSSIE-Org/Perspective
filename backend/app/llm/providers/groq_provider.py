from typing import Optional
from langchain_groq import ChatGroq
from langchain_core.language_models.chat_models import BaseChatModel
from app.llm.providers.base import BaseLLMProvider
from app.config import settings

class GroqProvider(BaseLLMProvider):
    def get_llm(self, model_name: Optional[str] = None, **kwargs) -> BaseChatModel:
        # Model resolution: explicit > provider-specific > global > default
        model = model_name or settings.GROQ_MODEL or settings.LLM_MODEL or "llama-3.3-70b-versatile"
        api_key = settings.GROQ_API_KEY
        
        if not api_key:
            raise ValueError("GROQ_API_KEY is not set")
        
        # Extract temperature and only pass if explicitly provided
        temperature = kwargs.pop("temperature", None)
        
        if temperature is not None:
            return ChatGroq(
                model=model,
                api_key=api_key,
                temperature=temperature,
                **kwargs
            )
        else:
            return ChatGroq(
                model=model,
                api_key=api_key,
                **kwargs
            )
