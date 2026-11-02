import type { Metadata } from "next";
import { defaultLanguage } from "@/config/languages";
import { generateLocaleMetadata } from "@/i18n/metadata";

const defaultLocalePath = `/${defaultLanguage}`;

// A static export cannot send HTTP redirects, so `/` ships the default
// locale's metadata (for crawlers and link previews) and forwards in the browser.
// The root layout only passes children through, so this page renders <html> itself.
// The inline script redirects as soon as it is parsed; a meta refresh alone only
// fires after every CSS and JS file has loaded, which showed the fallback link on
// first visits. The meta refresh and the link remain for browsers without JavaScript.
export const metadata: Metadata = generateLocaleMetadata(defaultLanguage);

export default function RootPage() {
  return (
    <html lang={defaultLanguage}>
      <body>
        <script dangerouslySetInnerHTML={{ __html: `location.replace(${JSON.stringify(defaultLocalePath)})` }} />
        <meta httpEquiv="refresh" content={`0; url=${defaultLocalePath}`} />
        <noscript>
          <p style={{ padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
            <a href={defaultLocalePath}>Continue to Perspective AI</a>
          </p>
        </noscript>
      </body>
    </html>
  );
}
