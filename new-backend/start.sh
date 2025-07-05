#!/bin/bash

# Step 1: Sync virtual environment from pyproject.toml
uv sync

# Step 2: Run FastAPI app
uv run main.py
