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
    INDEX_NAME (str): Name of the Pinecone index used for storing vectors.
    DIMENSIONS (int): Dimensionality of vector embeddings.
    METRIC (str): Similarity metric used for vector comparison.
    index (pinecone.Index): Connected Pinecone index instance.

Raises:
    ValueError: If `PINECONE_API_KEY` is not set in environment variables.
    RuntimeError: If Pinecone initialization or index connection fails.
"""

import os
from pinecone import Pinecone, ServerlessSpec, CloudProvider, AwsRegion
from app.logging.logging_config import setup_logger


logger = setup_logger(__name__)

# Load Pinecone credentials from environment variables
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
if not PINECONE_API_KEY:
    raise ValueError("PINECONE_API_KEY environment variable is required")
try:
    # Initialize Pinecone client
    pc = Pinecone(api_key=PINECONE_API_KEY)

except Exception as e:
    raise RuntimeError(f"Error occured while intialising pinecone client:{e}")

# Constants
INDEX_NAME = "perspective"
DIMENSIONS = 384
METRIC = "cosine"

# Create index if it doesn't exist
if not pc.has_index(INDEX_NAME):
    logger.info(f"Creating index: {INDEX_NAME}")
    pc.create_index(
        name=INDEX_NAME,
        dimension=DIMENSIONS,
        metric=METRIC,
        spec=ServerlessSpec(cloud=CloudProvider.AWS, region=AwsRegion.US_EAST_1),
    )
else:
    logger.info(f"Index '{INDEX_NAME}' already exists")

try:
    # Connect to the index
    index = pc.Index(INDEX_NAME)
except Exception as e:
    raise RuntimeError(f"Error occured while connecting to the index {INDEX_NAME}:{e}")
