# Perspective — Frontend

The web client for **Perspective-AI**, an app that analyzes an article and generates a balanced, fact-grounded counter-perspective. This directory contains the Next.js frontend; the FastAPI backend lives in [`../backend`](../backend), and the full system overview is in the [root README](../README.md).

## Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org) (App Router) with [React 19](https://react.dev)
- **Language:** TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com) (Radix UI primitives)
- **Internationalization:** [next-intl](https://next-intl.dev) (English + Hindi)
- **Icons / motion / charts:** `lucide-react`, `motion`, `recharts`
- **HTTP:** `axios`

## Prerequisites

- **Node.js** 20.9 or newer
- **npm** (ships with Node)

## Getting Started

From this `frontend/` directory:

```bash
# 1. Install dependencies
npm install

# 2. Configure the backend API URL (see "Environment Variables" below)
#    Create a .env.local file:
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to the default locale (e.g. `/en`).

> The app talks to the backend. Run it locally (see [`../backend/README.md`](../backend/README.md)) or point `NEXT_PUBLIC_API_URL` at a hosted instance.

## Environment Variables

| Variable | Required | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | No | Base URL of the Perspective backend. Defaults to the hosted Hugging Face Space if unset. Set to `http://localhost:8000` for local backend development. |

Because it is prefixed with `NEXT_PUBLIC_`, this value is exposed to the browser. Put it in a git-ignored `.env.local` file.

## Available Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run dev:turbo` | Start the dev server with Turbopack |
| `npm run build` | Create a production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Run ESLint |

## Internationalization (i18n)

Routing is locale-prefixed via `next-intl` (`localePrefix: 'always'`), so every route lives under a locale segment — `/en/about`, `/hi/about`, etc.

- **Supported locales** are defined in [`config/languages.ts`](config/languages.ts) — currently `en` (English) and `hi` (हिन्दी), with `en` as the default.
- **Translation catalogs** live in [`messages/en.json`](messages/en.json) and [`messages/hi.json`](messages/hi.json).
- **next-intl wiring** is in [`i18n/`](i18n): `routing.ts` (locales/default), `request.ts` (per-request config), `navigation.ts` (locale-aware `Link`/`useRouter`), and `messages.ts` (catalog map).

To **add a locale**: add an entry to `config/languages.ts`, create a matching `messages/<code>.json` catalog, and register the catalog in `i18n/messages.ts`.

## Project Structure

```
frontend/
├── app/
│   └── [locale]/          # Locale-prefixed routes
│       ├── about/
│       ├── analyze/       # Analyze flow (loading, results)
│       ├── contribute/
│       └── impact/
├── components/
│   └── ui/                # shadcn/ui components
├── config/languages.ts    # Supported locales (source of truth)
├── i18n/                  # next-intl configuration
├── lib/utils.ts           # `cn()` class-merge helper
├── messages/              # Translation catalogs (en, hi)
├── components.json        # shadcn/ui config
└── next.config.mjs        # Next.js + next-intl config
```

## UI Components (shadcn/ui)

This project uses [shadcn/ui](https://ui.shadcn.com). Configuration (aliases, style, base color) is in [`components.json`](components.json). Add a component with:

```bash
npx shadcn@latest add <component>
```

Components are generated into `components/ui`. Import path aliases (e.g. `@/components`, `@/lib/utils`) are configured in [`tsconfig.json`](tsconfig.json).

## Notes

- `next.config.mjs` redirects `/:locale/analyze` → `/:locale`, sets `images.unoptimized`, and currently sets `eslint.ignoreDuringBuilds` / `typescript.ignoreBuildErrors` to `true` — so `next build` will not fail on lint or type errors. Run `npm run lint` separately to catch issues.

## Contributing

See the repository [CONTRIBUTING guide](../CONTRIBUTING.md) for branch naming, commit conventions (Conventional Commits + DCO sign-off), and the PR process.
