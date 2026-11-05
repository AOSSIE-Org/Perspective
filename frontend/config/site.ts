/**
 * Production origin of the frontend. Set NEXT_PUBLIC_SITE_URL at build time once the
 * final domain is assigned (planned: perspective.aossie.org).
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://perspective.aossie.org").replace(/\/+$/, "");

/**
 * Legal pages, relative to the locale root, and the Markdown file each one renders. The files live at
 * the repository root and are read at build time, which runs in frontend/.
 */
export const LEGAL_PAGES = {
  privacy: { path: "/privacy", source: "../PRIVACY.md" },
  terms: { path: "/terms", source: "../TERMS.md" },
} as const;

/** The page, relative to the locale root, that asks visitors to support the project. */
export const SUPPORT_PAGE_PATH = "/support";

/** Public pages listed in the sitemap, relative to the locale root. The analyze flow is per-user and not indexed. */
export const PUBLIC_PAGES = [
  { path: "", priority: 1 },
  { path: "/about", priority: 0.8 },
  { path: "/contribute", priority: 0.7 },
  { path: LEGAL_PAGES.privacy.path, priority: 0.3 },
  { path: LEGAL_PAGES.terms.path, priority: 0.3 },
  { path: SUPPORT_PAGE_PATH, priority: 0.3 },
] as const;

/** 1200x630 raster share image; social platforms do not render SVG previews. */
export const OG_IMAGE = { path: "/og-image.png", width: 1200, height: 630 } as const;
