import unittest
from unittest.mock import MagicMock, patch
import logging

# Adjust path to import app modules
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.llm.manager import LLMManager
from app.llm.providers.base import BaseLLMProvider
from langchain_core.messages import AIMessage

# Configure logging to capture output during tests
logging.basicConfig(level=logging.INFO)

class MockChatModel:
    def __init__(self, provider_name, should_fail=False):
        self.provider_name = provider_name
        self.should_fail = should_fail

    def invoke(self, messages, **kwargs):
        if self.should_fail:
            raise Exception(f"Simulated failure for {self.provider_name}")
        return AIMessage(content=f"Response from {self.provider_name}")

class MockProvider(BaseLLMProvider):
    def __init__(self, name, should_fail_init=False, should_fail_invoke=False):
        self.name = name
        self.should_fail_init = should_fail_init
        self.should_fail_invoke = should_fail_invoke

    def get_llm(self, model_name=None, **kwargs):
        if self.should_fail_init:
            raise ValueError(f"Simulated init failure for {self.name}")
        return MockChatModel(self.name, should_fail=self.should_fail_invoke)

class TestLLMManager(unittest.TestCase):

    def setUp(self):
        # Reset singleton or state if necessary (LLMManager is a class, but we instantiate it)
        pass

    @patch('app.llm.manager.settings')
    def test_routing_openai(self, mock_settings):
        """Test that LLMManager routes to OpenAI when configured."""
        mock_settings.LLM_PROVIDER = "openai"
        mock_settings.LLM_MODEL = "gpt-test"
        mock_settings.OPENAI_API_KEY = "fake-key" # Manager checks this via provider, but we are mocking provider
        
        manager = LLMManager()
        
        # Patch the providers dictionary on the INSTANCE or CLASS
        # Since _providers is a class attribute, we should patch it on the instance or subclass
        
        # Better: Mock the provider classes in the dictionary
        mock_openai_provider = MockProvider("openai")
        
        with patch.dict(manager._providers, {"openai": lambda: mock_openai_provider}, clear=True):
            llm = manager.get_llm()
            response = llm.invoke("Hi")
            self.assertEqual(response.content, "Response from openai")

    @patch('app.llm.manager.settings')
    def test_routing_groq(self, mock_settings):
        """Test that LLMManager routes to Groq."""
        mock_settings.LLM_PROVIDER = "groq"
        mock_settings.GROQ_API_KEY = "fake-key"
        
        manager = LLMManager()
        mock_groq_provider = MockProvider("groq")
        
        with patch.dict(manager._providers, {"groq": lambda: mock_groq_provider}, clear=True):
            llm = manager.get_llm()
            response = llm.invoke("Hi")
            self.assertEqual(response.content, "Response from groq")

    @patch('app.llm.manager.settings')
    def test_fallback_logic(self, mock_settings):
        """Test fallback when primary provider fails to initialize."""
        mock_settings.LLM_PROVIDER = "primary"
        
        manager = LLMManager()
        
        # Setup: Primary fails init, Secondary succeeds
        mock_primary = MockProvider("primary", should_fail_init=True)
        mock_secondary = MockProvider("secondary", should_fail_init=False)
        
        providers_map = {
            "primary": lambda: mock_primary,
            "secondary": lambda: mock_secondary
        }
        
        with patch.dict(manager._providers, providers_map, clear=True):
            # Should log warning and try secondary
            llm = manager.get_llm()
            # It should be the secondary provider's LLM
            self.assertEqual(llm.provider_name, "secondary")

    @patch('app.llm.manager.settings')
    def test_get_provider_explicit(self, mock_settings):
        """Test getting a specific provider by name."""
        manager = LLMManager()
        mock_gemini = MockProvider("gemini")
        
        with patch.dict(manager._providers, {"gemini": lambda: mock_gemini}, clear=True):
            llm = manager.get_llm(provider_name="gemini")
            self.assertEqual(llm.provider_name, "gemini")

if __name__ == '__main__':
    unittest.main()
