<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Perspective AI

Perspective is an AI-powered platform by AOSSIE designed to combat echo chambers and algorithmic bias by providing readers with balanced, fact-checked counter-perspectives to online articles.

## 🛠️ Stack & Commands

- **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS v3/v4, `next-intl` (i18n & l10n), `next-themes` (light/dark state manager), `cobe` (3D interactive globe), `motion`.
- **Backend:** FastAPI, Python 3.13, LangGraph, LangChain, Groq SDK (LLaMA 3.3), Pinecone Vector DB, Sentence Transformers (`all-MiniLM-L6-v2`), `uv` package manager.
- **Frontend Build:** `npm run build` (inside `frontend/`)
- **Frontend Develop:** `npm run dev` (inside `frontend/`)
- **Backend Develop:** `uv run main.py` (inside `backend/`)

---

## 🎨 Styles & Theme System

- **Class-Based Dark Mode:** Configured with semantic tokens in [`frontend/app/globals.css`](frontend/app/globals.css).
- **Dual Palettes:**
  - **Dark Mode:** Deep Navy Blue (`#02183c` / `#031f4b`) with white text and ice-blue button accents (`#dbeafe`).
  - **Light Mode:** Warm Cream / Biscuit Parchment (`#f6eedb`) with charcoal typography (`#18181b`) and amber/gold accents.
- **Semantic Tokens:** Avoid inline dark utilities. Always use semantic token classes like `bg-background`, `text-foreground`, `bg-card`, `border-border`.

---

## 🌐 i18n & l10n Routing

- **Dynamic segment:** All localized pages and layouts must be nested inside [`frontend/app/[locale]/`](frontend/app/[locale]/).
- **Awaiting params:** Layout and Page `params` props are Promises in Next.js 15/16. Always `await params` before accessing `locale`.
- **Navigation:** Import `Link`, `useRouter`, or `usePathname` from local configuration helpers in [`frontend/i18n/navigation.ts`](frontend/i18n/navigation.ts).
- **Catalogs:** Add user-visible strings to [`frontend/messages/en.json`](frontend/messages/en.json) and [`frontend/messages/hi.json`](frontend/messages/hi.json).

---

## 📦 Project Boundaries

- **Config Alias Map:** `"next-intl/config"` is mapped to local request setup inside [`frontend/next.config.mjs`](frontend/next.config.mjs) using `createNextIntlPlugin('./i18n/request.ts')`.
- **Branding Assets:** Official branding logo, favicon, and style specifications reside inside [`frontend/public/brand/`](frontend/public/brand/).
