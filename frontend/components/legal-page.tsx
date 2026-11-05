import fs from "node:fs";
import path from "node:path";
import { getTranslations } from "next-intl/server";
import { getPathname } from "@/i18n/navigation";
import { LEGAL_PAGES } from "@/config/site";
import { LegalDocument } from "@/lib/legal-markdown";

// Typography for the rendered Markdown, built from the app's semantic tokens so it follows the theme
const documentStyles = [
  "[&_h1]:text-2xl sm:[&_h1]:text-4xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h1]:mb-4",
  "[&_h2]:text-lg sm:[&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground [&_h2]:mt-10 [&_h2]:mb-3",
  "[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_h3]:mt-6 [&_h3]:mb-2",
  "[&_p]:text-sm sm:[&_p]:text-base [&_p]:leading-relaxed [&_p]:text-foreground-muted [&_p]:mb-4",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:mb-4 [&_ul]:space-y-2",
  "[&_li]:text-sm sm:[&_li]:text-base [&_li]:leading-relaxed [&_li]:text-foreground-muted",
  "[&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:opacity-80",
  "[&_code]:rounded-sm [&_code]:bg-secondary [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-foreground",
].join(" ");

/** Renders the repository's PRIVACY.md or TERMS.md, read at build time, as a localized page. */
export async function LegalPage({ locale, page }: { locale: string; page: keyof typeof LEGAL_PAGES }) {
  const t = await getTranslations({ locale, namespace: "Legal" });
  const source = fs.readFileSync(path.join(process.cwd(), LEGAL_PAGES[page].source), "utf8");
  const links = {
    privacy: getPathname({ href: LEGAL_PAGES.privacy.path, locale }),
    terms: getPathname({ href: LEGAL_PAGES.terms.path, locale }),
  };

  return (
    <div className="w-full h-full overflow-y-auto">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 md:pt-10 lg:pt-12 pb-24">
        {/* The documents are written in English only */}
        {locale !== "en" && (
          <p className="mb-6 rounded-[4px] border border-brand-border bg-card/60 px-4 py-2.5 text-xs sm:text-sm text-foreground-muted">
            {t("englishOnly")}
          </p>
        )}
        <LegalDocument source={source} links={links} className={documentStyles} />
      </article>
    </div>
  );
}
