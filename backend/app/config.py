"""
config.py
---------
Central settings for the Perspective backend.

Every tunable value used by the backend (model names, sampling parameters,
vector store layout, search and scraping limits, pipeline thresholds and
server defaults) lives here so it can be reviewed and changed in one place.

Secrets are not stored here: API keys are still read from environment
variables by the modules that use them.
"""

# --- Server ---------------------------------------------------------------
SERVER_HOST = "0.0.0.0"
DEFAULT_PORT = 7860  # used when the PORT environment variable is not set
CORS_ALLOW_ORIGINS = ["*"]

# --- Groq LLM models --------------------------------------------------------
GROQ_LARGE_MODEL = "openai/gpt-oss-120b"
GROQ_SMALL_MODEL = "openai/gpt-oss-20b"

# Bias scoring (modules/bias_detection/check_bias.py)
BIAS_MODEL = GROQ_LARGE_MODEL
BIAS_TEMPERATURE = 0.2
BIAS_MAX_TOKENS = 32

# RAG chat answers (modules/chat/llm_processing.py); provider defaults for sampling
CHAT_MODEL = GROQ_LARGE_MODEL

# Claim extraction (modules/facts_check/llm_processing.py)
CLAIM_EXTRACTOR_MODEL = GROQ_SMALL_MODEL
CLAIM_EXTRACTOR_TEMPERATURE = 0.3
CLAIM_EXTRACTOR_MAX_TOKENS = 512

# Claim verification (modules/facts_check/llm_processing.py)
FACT_VERIFIER_MODEL = GROQ_SMALL_MODEL
FACT_VERIFIER_TEMPERATURE = 0.3
FACT_VERIFIER_MAX_TOKENS = 1024

# Sentiment analysis (modules/langgraph_nodes/sentiment.py)
SENTIMENT_MODEL = GROQ_SMALL_MODEL
SENTIMENT_TEMPERATURE = 0.2
SENTIMENT_MAX_TOKENS = 64
SENTIMENT_REASONING_EFFORT = "low"

# Counter-perspective generation (modules/langgraph_nodes/generate_perspective.py)
PERSPECTIVE_MODEL = GROQ_LARGE_MODEL
PERSPECTIVE_TEMPERATURE = 0.6

# Perspective judging (modules/langgraph_nodes/judge.py)
JUDGE_MODEL = GROQ_SMALL_MODEL
JUDGE_TEMPERATURE = 0.0
JUDGE_MAX_TOKENS = 256

# --- Perspective retry loop (modules/langgraph_builder.py) -------------------
PERSPECTIVE_MIN_SCORE = 70  # judge scores below this trigger a regeneration
PERSPECTIVE_MAX_RETRIES = 3

# --- Embeddings and vector store ------------------------------------------
EMBEDDING_MODEL = "all-MiniLM-L6-v2"
PINECONE_INDEX_NAME = "perspective"
PINECONE_DIMENSIONS = 384  # must match the output size of EMBEDDING_MODEL
PINECONE_METRIC = "cosine"
PINECONE_CLOUD = "aws"
PINECONE_REGION = "us-east-1"
PINECONE_NAMESPACE = "default"
RAG_TOP_K = 5

# --- Fact checking (utils/fact_check_utils.py) ------------------------------
MAX_CLAIMS = 3
CLAIM_SEARCH_WORKERS = 3
MIN_CLAIM_CHARS = 15  # extracted lines this short or shorter are dropped
MIN_FALLBACK_SENTENCE_CHARS = 25  # article sentences used when no claims parse

# --- Web search (modules/facts_check/web_search.py) -------------------------
GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1"
GOOGLE_SEARCH_ENGINE_ID = "f637ab77b5d8b4a3c"
GOOGLE_SEARCH_TIMEOUT_SECONDS = 8
SEARCH_KEY_PLACEHOLDER = "your_google_search_api_key_here"  # value from .env.example
DDG_MAX_RESULTS = 3

# --- Scraping ---------------------------------------------------------------
SCRAPER_USER_AGENT = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    " AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/113.0 Safari/537.36"
)
FETCH_MAX_REDIRECTS = 5
FETCH_MAX_BYTES = 5 * 1024 * 1024
FETCH_TIMEOUT_SECONDS = 10
FETCH_CHUNK_BYTES = 65536
MIN_LINE_CHARS = 30  # cleaned article lines this short or shorter are dropped
MAX_KEYWORDS = 15
