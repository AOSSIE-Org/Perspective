from typing import Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.language_models.chat_models import BaseChatModel
from app.llm.providers.base import BaseLLMProvider
from app.config import settings

class GeminiProvider(BaseLLMProvider):
    def get_llm(self, model_name: Optional[str] = None, **kwargs) -> BaseChatModel:
        # Model resolution: explicit > provider-specific > global > default
        model = model_name or settings.GEMINI_MODEL or settings.LLM_MODEL or "gemini-1.5-pro"
        api_key = settings.GOOGLE_API_KEY
        
        if not api_key:
            raise ValueError("GOOGLE_API_KEY is not set")
        
        # Extract temperature and only pass if explicitly provided
        temperature = kwargs.pop("temperature", None)
        
        if temperature is not None:
            return ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                temperature=temperature,
                **kwargs
            )
        else:
            return ChatGoogleGenerativeAI(
                model=model,
                google_api_key=api_key,
                **kwargs
            )
