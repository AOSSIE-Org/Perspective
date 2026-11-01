---
title: Perspective API 🧠
emoji: 🧠
colorFrom: green
colorTo: blue
sdk: docker
sdk_version: "0.100.0"
app_file: Dockerfile
pinned: false
---


# Perspective Backend


Welcome to the **Perspective** backend! 🚀

This backend is built with FastAPI and managed using **uv**, a handy Python project tool that simplifies dependency management and running the app.

---

## Getting Started

### 1. Clone the repo & jump into backend folder

```bash
git clone https://github.com/AOSSIE-Org/Perspective.git
cd new-backend
````

### 2. Add new modules easily

To add any new Python package/module, just run:

```bash
uv add <module_name>
```

Example:

```bash
uv add fastapi requests
```

This will automatically update your `pyproject.toml` and install the package for you.

*No need to manually create or activate virtual environments — uv handles it for you!*

### 3. Run the server

Start the backend server with:

```bash
uv run main.py
```

The server will be available at:

```
http://localhost:8000/api/
```

### 4. Run the tests

```bash
uv run pytest          # run the suite
uv run pytest --cov    # also measure coverage of app/ and main.py
```

The tests in `tests/` fake Groq, Pinecone, web search and the embedding model, so they need no API keys or network access. `tests/test_properties.py` holds [Hypothesis](https://hypothesis.readthedocs.io/) property tests for the URL guard, chunk IDs, chunking and keyword extraction. New backend functionality must come with tests here (see [CONTRIBUTING.md](../CONTRIBUTING.md#-testing-policy)); CI runs them in [`backend-ci.yml`](../.github/workflows/backend-ci.yml) with `uv run pytest --cov`, which fails if total coverage drops below 90% (`fail_under` in `pyproject.toml`). `--cov` prints the uncovered lines of each file that is not fully covered.

---

## API Reference

The endpoints (`GET /api/`, `POST /api/bias`, `POST /api/process`, `POST /api/chat`), their request and response bodies, errors, limits and required environment variables are documented in [API.md](API.md).

---

## Important Notes

* All dependencies are tracked in `pyproject.toml`.
* No manual setup of venv or conda environments is required.
* For full documentation on **uv**, visit:
  [https://docs.astral.sh/uv/](https://docs.astral.sh/uv/)

---

## Project Structure (brief)

```
new-backend/
├── main.py               # App entry point
├── pyproject.toml        # Dependency & project config
├── uv.lock               # .loc file like package-lock.json
├── .python-version       # Python version used by the backend
└── app/
    ├── routes/           # API route handlers
    ├── components/       # Business logic components
    ├── db/               # Database related code
    └── utils/            # Utility functions
```

---

If you hit any issues or want to contribute, feel free to open an issue or PR.
