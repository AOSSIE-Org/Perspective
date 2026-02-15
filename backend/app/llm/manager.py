from typing import Dict, Type, Optional
from langchain_core.language_models.chat_models import BaseChatModel
from app.config import settings
from app.llm.providers.base import BaseLLMProvider
from app.llm.providers.openai_provider import OpenAIProvider
from app.llm.providers.groq_provider import GroqProvider
from app.llm.providers.gemini_provider import GeminiProvider
import logging

logger = logging.getLogger(__name__)

class LLMManager:
    _providers: Dict[str, Type[BaseLLMProvider]] = {
        "openai": OpenAIProvider,
        "groq": GroqProvider,
        "gemini": GeminiProvider,
    }

    def __init__(self):
        self.primary_provider = settings.LLM_PROVIDER.lower()

    def get_provider(self, provider_name: str) -> BaseLLMProvider:
        provider_class = self._providers.get(provider_name.lower())
        if not provider_class:
            raise ValueError(f"Provider '{provider_name}' not supported.")
        return provider_class()

    def get_llm(self, provider_name: Optional[str] = None, **kwargs) -> BaseChatModel:
        """
        Get an LLM instance with runtime fallback support.
        Tries the requested/primary provider first.
        If it fails (initialization OR runtime), tries fallbacks.
        """
        target_provider = provider_name or self.primary_provider
        
        try:
            primary_llm = self._create_llm(target_provider, **kwargs)
            
            # Build fallback chain for runtime errors
            fallback_llms = self._build_fallbacks(target_provider, **kwargs)
            
            if fallback_llms:
                return primary_llm.with_fallbacks(fallback_llms)
            return primary_llm
            
        except Exception as e:
            logger.warning(f"Failed to initialize primary provider '{target_provider}': {e}")
            return self._fallback(**kwargs)

    def _create_llm(self, provider_name: str, **kwargs) -> BaseChatModel:
        provider = self.get_provider(provider_name)
        return provider.get_llm(**kwargs)
    
    def _build_fallbacks(self, primary_provider: str, **kwargs) -> list[BaseChatModel]:
        """
        Build a list of fallback LLMs for runtime error handling.
        Strips provider-specific kwargs like model_name to avoid cross-provider errors.
        """
        fallback_llms = []
        # Strip provider-specific kwargs
        safe_kwargs = {k: v for k, v in kwargs.items() if k != "model_name"}
        
        for name in self._providers.keys():
            if name == primary_provider:
                continue
            
            try:
                fallback_llm = self._create_llm(name, **safe_kwargs)
                fallback_llms.append(fallback_llm)
            except Exception as e:
                logger.debug(f"Could not initialize fallback provider '{name}': {e}")
        
        return fallback_llms

    def _fallback(self, **kwargs) -> BaseChatModel:
        """
        Simple fallback strategy: try all other available providers.
        """
        for name in self._providers.keys():
            if name == self.primary_provider:
                continue
            
            try:
                logger.info(f"Attempting fallback to provider: {name}")
                return self._create_llm(name, **kwargs)
            except Exception as e:
                logger.debug(f"Fallback provider '{name}' failed: {e}")
                continue
        
        raise RuntimeError("All LLM providers failed to initialize.")
