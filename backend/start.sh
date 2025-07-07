#!/bin/bash
set -e

# Install uv if not present
pip install uv

# Sync environment and run app
uv sync
uv run main.py
