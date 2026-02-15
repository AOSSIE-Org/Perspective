from abc import ABC, abstractmethod
from typing import Any, Optional
from langchain_core.language_models.chat_models import BaseChatModel

class BaseLLMProvider(ABC):
    """
    Abstract base class for LLM providers.
    """
    
    @abstractmethod
    def get_llm(self, model_name: Optional[str] = None, **kwargs) -> BaseChatModel:
        """
        Returns the underlying LangChain chat model.
        """
        pass
