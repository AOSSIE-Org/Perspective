FROM python:3.11-slim

# Optional: install build tools (for C deps)
RUN apt-get update && apt-get install -y curl build-essential

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh

# Add uv to PATH (it's installed at /root/.cargo/bin)
ENV PATH="/root/.cargo/bin:${PATH}"

# Set workdir
WORKDIR /app

# Copy lock and pyproject
COPY uv.lock pyproject.toml ./

# Sync deps using uv
RUN uv sync

# Copy full project
COPY . .

# Expose HF port
EXPOSE 7860

# Run app using uv
CMD ["uv", "run", "main.py"]
