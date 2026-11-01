"""
conftest.py
-----------
Shared pytest fixtures for the Perspective backend test suite.

Import-time side effects (Groq client initialization, Pinecone connections)
are handled in each individual test module by setting dummy environment
variables and inserting sys.modules stubs before importing application code.
This conftest.py does not perform any of that stubbing; it only provides
shared fixtures that are genuinely useful across multiple test files.
"""

import os
import sys
import pathlib
import pytest

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------

FIXTURES_DIR = pathlib.Path(__file__).parent / "fixtures"


@pytest.fixture()
def sample_html() -> str:
    return (FIXTURES_DIR / "sample_article.html").read_text(encoding="utf-8")


# ---------------------------------------------------------------------------
# Minimal state shapes used across multiple test files
# ---------------------------------------------------------------------------

@pytest.fixture()
def article_state():
    """Minimal pipeline state with cleaned_text populated."""
    return {
        "cleaned_text": (
            "Scientists confirmed that global ice sheets are melting at an unprecedented rate "
            "driven by rising greenhouse gas emissions from human industrial activity. "
            "The Greenland ice sheet lost approximately 280 billion tonnes of ice per year "
            "between 2002 and 2023, contributing to rising sea levels worldwide."
        ),
        "keywords": ["ice melt", "greenhouse gas", "climate change"],
        "status": "success",
    }


@pytest.fixture()
def full_pipeline_state(article_state):
    """Pipeline state after fact-checking and perspective generation."""
    from unittest.mock import MagicMock

    perspective = MagicMock()
    perspective.perspective = "Counter: fossil fuel industry has overstated uncertainty."
    perspective.reasoning = "Step 1: examine economic incentives. Step 2: review IPCC data."

    return {
        **article_state,
        "sentiment": "negative",
        "facts": [
            {
                "original_claim": "Ice sheets are melting at unprecedented rate.",
                "verdict": "True",
                "explanation": "Supported by NASA satellite data.",
                "source_link": "https://example.com/nasa-study",
            }
        ],
        "perspective": perspective,
        "score": 85,
        "retries": 1,
    }


# ---------------------------------------------------------------------------
# Mocked LLM response helpers
# ---------------------------------------------------------------------------

def make_mock_completion(content: str):
    """Build a minimal mock that mimics groq ChatCompletion structure."""
    from unittest.mock import MagicMock

    mock = MagicMock()
    mock.choices[0].message.content = content
    return mock
