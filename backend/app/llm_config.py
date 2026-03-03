import os
from dotenv import load_dotenv

load_dotenv()

LLM_MODEL = os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile")


def get_llm(provider: str = "groq", temperature: float = 0.7):
    """Return a LangChain chat model for the requested provider.

    Supported providers: ``"groq"`` (default), ``"gemini"``.
    API keys and model names are read from environment variables so that
    users can bring their own keys (BYOK).
    """

    if provider == "gemini":
        from langchain_google_genai import ChatGoogleGenerativeAI

        api_key = os.getenv("GEMINI_API_KEY")
        model_name = os.getenv("GEMINI_MODEL_NAME", "gemini-2.5-flash")
        if not api_key:
            raise ValueError(
                "GEMINI_API_KEY environment variable is required for Gemini"
            )
        return ChatGoogleGenerativeAI(
            model=model_name,
            google_api_key=api_key,
            temperature=temperature,
        )

    # Default → Groq
    from langchain_groq import ChatGroq

    api_key = os.getenv("GROQ_API_KEY")
    model_name = os.getenv("GROQ_MODEL_NAME", "llama-3.3-70b-versatile")
    if not api_key:
        raise ValueError("GROQ_API_KEY environment variable is required for Groq")
    return ChatGroq(
        model=model_name,
        api_key=api_key,
        temperature=temperature,
    )