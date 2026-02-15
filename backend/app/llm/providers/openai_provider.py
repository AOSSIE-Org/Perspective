from typing import Optional
from langchain_openai import ChatOpenAI
from langchain_core.language_models.chat_models import BaseChatModel
from app.llm.providers.base import BaseLLMProvider
from app.config import settings

class OpenAIProvider(BaseLLMProvider):
    def get_llm(self, model_name: Optional[str] = None, **kwargs) -> BaseChatModel:
        # Model resolution: explicit > provider-specific > global > default
        model = model_name or settings.OPENAI_MODEL or settings.LLM_MODEL or "gpt-4o"
        api_key = settings.OPENAI_API_KEY
        
        if not api_key:
            raise ValueError("OPENAI_API_KEY is not set")
        
        # Extract temperature and only pass if explicitly provided
        temperature = kwargs.pop("temperature", None)
        
        if temperature is not None:
            return ChatOpenAI(
                model=model,
                api_key=api_key,
                temperature=temperature,
                **kwargs
            )
        else:
            return ChatOpenAI(
                model=model,
                api_key=api_key,
                **kwargs
            )
