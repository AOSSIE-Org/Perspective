import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    # Core settings
    APP_NAME: str = "Perspective Backend"
    ENV: str = "development"

    # LLM Configuration
    LLM_PROVIDER: str = "groq"  # specific default
    LLM_MODEL: str | None = None  # Deprecated: use provider-specific models below
    
    # Provider-specific model configurations
    OPENAI_MODEL: str | None = None
    GROQ_MODEL: str | None = None
    GEMINI_MODEL: str | None = None

    # API Keys
    GROQ_API_KEY: str | None = None
    OPENAI_API_KEY: str | None = None
    GOOGLE_API_KEY: str | None = None
    
    # Other secrets (add as needed from existing .env)
    PINECONE_API_KEY: str | None = None
    PINECONE_INDEX_NAME: str | None = None
    
    # Search
    TAVILY_API_KEY: str | None = None # If used

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
