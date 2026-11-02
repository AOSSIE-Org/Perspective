# Contributing to Perspective

We welcome contributions of all kinds! Whether you are fixing a bug, adding a new LangGraph node, expanding frontend visualization features, improving documentation, or adding localized translations, your help is appreciated.

---

## 💬 Join our Discord Community

If you have questions, feedback, or want to discuss ideas before building:
- **AOSSIE Discord Server:** [https://discord.gg/hjUhu33uAn](https://discord.gg/hjUhu33uAn)
- **Discord Channel:** [#perspective](https://discord.com/channels/1022871757289422898/1339226574276268144) (join the server first; the channel link only opens for members)
- **Official Repository:** [https://github.com/AOSSIE-Org/Perspective](https://github.com/AOSSIE-Org/Perspective)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v22` or higher (matches CI)
- **Python**: `3.13` or higher
- **uv**: Python package manager ([https://docs.astral.sh/uv/](https://docs.astral.sh/uv/))

### 2. Fork & Clone
```bash
git clone https://github.com/AOSSIE-Org/Perspective.git
cd Perspective
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 4. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your GROQ_API_KEY and PINECONE_API_KEY in .env
uv sync --no-build-isolation
uv run main.py
```
The FastAPI backend runs on [http://localhost:8000](http://localhost:8000).

---

## 📋 Pull Request Guidelines

1. **Create a Feature Branch:**
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Quality Checks:**
   Run the same checks as CI before submitting:
   ```bash
   cd frontend
   npm run lint
   npx tsc --noEmit
   npm run test:coverage   # Vitest; fails below 90% coverage
   npm run build           # static export to frontend/out
   ```
   For backend changes:
   ```bash
   cd backend
   uv run pytest --cov     # pytest; fails below 90% coverage
   ```
3. **Include tests:** every pull request that adds or changes functionality must add or update tests, as described in the [Testing Policy](#-testing-policy).
4. **Commit Messages:**
   Use clear, descriptive commit messages following Conventional Commits (e.g., `feat: add preset topic card`, `fix: header logo alignment`).
5. **Developer Certificate of Origin (DCO):**
   Ensure your commits adhere to our [`DCO.md`](DCO.md).

---

## 🧪 Testing Policy

All new functionality, in the frontend and the backend, must include tests in the automated test suites, and bug fixes should add a test that fails without the fix. Pull requests that add behaviour without tests will not be merged.

| Part | Tests live in | Run locally | Framework |
|------|---------------|-------------|-----------|
| Frontend | `frontend/tests/` | `npm test` in `frontend/` (`npm run test:coverage` for the CI coverage check) | [Vitest](https://vitest.dev) |
| Backend | `backend/tests/` | `uv run pytest` in `backend/` (`uv run pytest --cov` for the CI coverage check) | [pytest](https://docs.pytest.org) |

- **Coverage is measured on the whole code base** and must stay at or above 90% (lines, branches, functions and statements) in both parts. A new page, component, hook or module is counted automatically, so it needs its own tests.
- **Frontend:** coverage includes everything under `app/`, `components/`, `hooks/`, `config/`, `i18n/` and `lib/`. The only exclusions are type declarations and shadcn/ui primitives that nothing imports, listed with their reasons in [`frontend/vitest.config.mts`](frontend/vitest.config.mts); when you start using one of those primitives, remove it from the list and test it. Render components with React Testing Library inside the real message catalogs (`renderWithIntl` in [`frontend/tests/helpers/intl.tsx`](frontend/tests/helpers/intl.tsx)), assert what the reader sees and can do, and mock only what jsdom cannot do (shared mocks are in [`frontend/tests/setup.ts`](frontend/tests/setup.ts)). Prefer [fast-check](https://fast-check.dev) property tests where the input space is large.
- **Backend:** tests must not need API keys or network access. [`backend/tests/conftest.py`](backend/tests/conftest.py) sets placeholder API keys, fakes Pinecone, the embedding model and NLTK downloads, and blocks DNS lookups and outbound connections; use its fixtures (`fake_chat_client` for Groq, `fake_index` for Pinecone, `resolve_hosts` for DNS) and `monkeypatch` for other external calls. Coverage covers `app/` and `main.py` (`[tool.coverage.*]` in [`backend/pyproject.toml`](backend/pyproject.toml)); use [Hypothesis](https://hypothesis.readthedocs.io) property tests where the input space is large.
- **CI enforces both suites:** [`frontend-ci.yml`](.github/workflows/frontend-ci.yml) runs lint, type-check, the Vitest suite with coverage and the build on changes to `frontend/`, and [`backend-ci.yml`](.github/workflows/backend-ci.yml) runs the pytest suite with coverage on changes to `backend/`. Pull requests are merged only when these checks pass.

---

## 🛠️ Code Style & Architecture

- **Next.js App Router:** Use React Server Components by default. Use `"use client"` only for interactive stateful components.
- **Design System:** Use semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`). Avoid ad-hoc inline dark classes.
- **Internationalization (i18n):** User-visible strings should be added to catalog files in `frontend/messages/en.json` and `frontend/messages/hi.json`. Use navigation helpers from `frontend/i18n/navigation.ts`.
- **No magic constants:** the backend URL, endpoints and timeouts live in `frontend/config/api.ts`; the site URL and public pages in `frontend/config/site.ts`.
- **Static export:** the frontend is deployed to GitHub Pages as static HTML, so do not add server-only features (`redirects()`, route handlers, cookies, middleware).
- **Zero TODOs Policy:** Ensure all code, documentation, and metadata files contain no remaining `TODO` placeholders.

Thank you for contributing to AOSSIE & Perspective!
