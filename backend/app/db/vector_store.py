"""
vector_store.py
------------------
Initializes and manages the Pinecone vector database connection for the Perspective API.

This module:
    - Loads Pinecone credentials from environment variables.
    - Creates the Pinecone index if it does not exist.
    - Connects to the specified index for vector operations.

Attributes:
    PINECONE_API_KEY (str): API key for authenticating with Pinecone.
    index (pinecone.Index): Connected Pinecone index instance.

The index name, dimensions, metric, cloud and region come from app.config.

Raises:
    ValueError: If `PINECONE_API_KEY` is not set in environment variables.
    RuntimeError: If Pinecone initialization or index connection fails.
"""

import os
from dotenv import load_dotenv
from pinecone import Pinecone, ServerlessSpec
from app.logging.logging_config import setup_logger
from app.config import (
    PINECONE_CLOUD,
    PINECONE_DIMENSIONS,
    PINECONE_INDEX_NAME,
    PINECONE_METRIC,
    PINECONE_REGION,
)

logger = setup_logger(__name__)

# Load environment variables from .env file
load_dotenv()

# Load Pinecone credentials from environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable is required")
try:
    # Initialize Pinecone client
    pc = Pinecone(api_key=PINECONE_API_KEY)

except Exception as e:
    raise RuntimeError(f"Error occured while intialising pinecone client:{e}")

# Create index if it doesn't exist
if not pc.has_index(PINECONE_INDEX_NAME):
    logger.info(f"Creating index: {PINECONE_INDEX_NAME}")
    pc.create_index(
        name=PINECONE_INDEX_NAME,
        dimension=PINECONE_DIMENSIONS,
        metric=PINECONE_METRIC,
        spec=ServerlessSpec(cloud=PINECONE_CLOUD, region=PINECONE_REGION),
    )
else:
    logger.info(f"Index '{PINECONE_INDEX_NAME}' already exists")

try:
    # Connect to the index
    index = pc.Index(PINECONE_INDEX_NAME)
except Exception as e:
    raise RuntimeError(f"Error occured while connecting to the index {PINECONE_INDEX_NAME}:{e}")
