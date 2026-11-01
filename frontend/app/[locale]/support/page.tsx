import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { generatePageMetadata } from "@/i18n/metadata";
import { SupportContent } from "@/components/support-content";
import { SUPPORT_STYLESHEET } from "@/config/support";
import { unlayerCss } from "@/lib/unlayer-css";

/**
 * Like the other pages, the support page fills the screen on desktop instead of scrolling. From lg, where the
 * project and AOSSIE sections sit side by side, the widget takes the full height of the page (its sections spread
 * from top to bottom) and a wider frame, and its padding and section gaps scale with the viewport, so the page
 * still fits a 768px-tall laptop and gets more room on larger screens. Text sizes stay the same. The page still
 * scrolls on screens too short to fit it, rather than cutting content off. The bottom padding leaves room for
 * the frame's corner marks, which sit half outside it.
 */
const SUPPORT_FIT_CSS = `
@media (min-width: 1024px) {
  .support-page .sub-root { padding: 0; }
  .support-page .sub-root > .z-10 {
    padding: clamp(1rem, 2.5vh, 3.5rem) clamp(2rem, 4.5vw, 5rem);
  }
  .support-page .sub-root > .z-10 > .mt-10 { margin-top: clamp(0.75rem, 2vh, 2.5rem); }
  .support-page .sub-root > .z-10 > .mt-20 { margin-top: clamp(1.5rem, 4vh, 4rem); }
  .support-page .sub-root > .z-10 > .mt-12 { margin-top: clamp(1.25rem, 3vh, 3rem); }
}`;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return generatePageMetadata(locale, "support");
}

export default async function SupportPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  // The widget's Tailwind v4 stylesheet cannot go through this site's Tailwind v3 PostCSS (it rejects `@layer base`
  // without `@tailwind base`), so it is read at build time and inlined on this page only, unlayered so that it
  // keeps its precedence over the site's unlayered styles. Every selector is scoped to the widget's `.sub-root`.
  const styles = unlayerCss(fs.readFileSync(path.join(process.cwd(), SUPPORT_STYLESHEET), "utf8")) + SUPPORT_FIT_CSS;

  return (
    <div className="support-page w-full h-full overflow-y-auto">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      <div className="max-w-5xl lg:max-w-6xl lg:h-full mx-auto px-4 sm:px-6 pt-3 sm:pt-6 md:pt-10 lg:pt-2 pb-24 lg:pb-4">
        <SupportContent />
      </div>
    </div>
  );
}
