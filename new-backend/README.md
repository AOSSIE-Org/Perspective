
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
