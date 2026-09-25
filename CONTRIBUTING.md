# Contributing to Perspective

We welcome contributions of all kinds! Whether you are fixing a bug, adding a new LangGraph node, expanding frontend visualization features, improving documentation, or adding localized translations, your help is appreciated.

---

## 💬 Join our Discord Community

If you have questions, feedback, or want to discuss ideas before building:
- **AOSSIE Discord Server:** [https://discord.gg/hjUhu33uAn](https://discord.gg/hjUhu33uAn)
- **Official Repository:** [https://github.com/AOSSIE-Org/Perspective](https://github.com/AOSSIE-Org/Perspective)

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: `v20.9.0` or higher
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
   Run lint and build commands before submitting:
   ```bash
   cd frontend
   npm run lint
   npm run build
   ```
3. **Commit Messages:**
   Use clear, descriptive commit messages following Conventional Commits (e.g., `feat: add preset topic card`, `fix: header logo alignment`).
4. **Developer Certificate of Origin (DCO):**
   Ensure your commits adhere to our [`DCO.md`](DCO.md).

---

## 🛠️ Code Style & Architecture

- **Next.js App Router:** Use React Server Components by default. Use `"use client"` only for interactive stateful components.
- **Design System:** Use semantic CSS variables (`bg-background`, `text-foreground`, `bg-card`). Avoid ad-hoc inline dark classes.
- **Internationalization (i18n):** User-visible strings should be added to catalog files in `frontend/messages/en.json` and `frontend/messages/hi.json`. Use navigation helpers from `frontend/i18n/navigation.ts`.
- **Zero TODOs Policy:** Ensure all code, documentation, and metadata files contain no remaining `TODO` placeholders.

Thank you for contributing to AOSSIE & Perspective!
