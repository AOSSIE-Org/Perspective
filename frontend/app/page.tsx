import type { Metadata } from "next";
import { defaultLanguage } from "@/config/languages";
import { generateLocaleMetadata } from "@/i18n/metadata";

const defaultLocalePath = `/${defaultLanguage}`;

// A static export cannot send HTTP redirects, so `/` ships the default
// locale's metadata (for crawlers and link previews) and forwards in the browser.
// The root layout only passes children through, so this page renders <html> itself.
export const metadata: Metadata = generateLocaleMetadata(defaultLanguage);

export default function RootPage() {
  return (
    <html lang={defaultLanguage}>
      <body>
        <meta httpEquiv="refresh" content={`0; url=${defaultLocalePath}`} />
        <p style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <a href={defaultLocalePath}>Continue to Perspective AI</a>
        </p>
      </body>
    </html>
  );
}
