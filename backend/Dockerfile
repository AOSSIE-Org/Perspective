FROM python:3.13-slim-bookworm

COPY --from=ghcr.io/astral-sh/uv:0.7.12 /uv /bin/uv

# Install OS dependencies
RUN apt-get update && apt-get install -y curl build-essential

# Create app dir and set it as working directory
WORKDIR /app

# Create a writable cache dir & change ownership to a non-root user
ENV UV_CACHE_DIR=/app/.uv-cache
RUN mkdir -p /app/.uv-cache && \
    adduser --disabled-password --gecos "" appuser && \
    chown -R appuser:appuser /app

# Copy project code
COPY . /app

# Switch to non-root user
USER appuser

# Install dependencies
RUN uv sync --locked --no-cache

# Expose the port Hugging Face looks for
EXPOSE 7860

# Start the app
CMD ["uv", "run", "main.py"]
