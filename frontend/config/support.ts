import { GSOC_URL, STABILITY_NEXUS_URL } from "./links";

/** Logos shown on the support page, served from `public/brand/icons/`. */
export const SUPPORT_LOGOS = {
  organization: "/brand/icons/aossie_logo.svg",
  project: "/brand/icons/perspective_logo.svg",
} as const;

/** Networks offered by the navbar share button, in display order. */
export const SHARE_PLATFORMS = ["whatsapp", "twitter", "linkedin", "telegram", "email"] as const;

/** The widget's stylesheet (scoped to `.sub-root`), read at build time relative to frontend/. */
export const SUPPORT_STYLESHEET = "node_modules/@aossie-org/support-us-button/dist/style.css";

/**
 * Organisations that support Perspective, shown as links on the support page. Names are proper nouns and are not
 * translated. No sponsorship tier is given, so the widget does not claim one.
 */
export const SUPPORTERS = [
  { name: "Google Summer of Code", link: GSOC_URL },
  { name: "Stability Nexus", link: STABILITY_NEXUS_URL },
] as const;
