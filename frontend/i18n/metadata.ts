import type { Metadata } from "next";
import { languages, defaultLanguage } from "@/config/languages";
import { SITE_URL, OG_IMAGE } from "@/config/site";
import enMessages from "../messages/en.json";
import hiMessages from "../messages/hi.json";

const metadataCatalog: Record<string, typeof enMessages.Metadata> = {
  en: enMessages.Metadata,
  hi: hiMessages.Metadata,
};

const ogLocales: Record<string, string> = { en: "en_US", hi: "hi_IN" };

/** Title, description, canonical, hreflang alternates and share image for a page in one locale. */
export function generateLocaleMetadata(locale: string, path = ""): Metadata {
  const { title, description } = metadataCatalog[locale] ?? metadataCatalog[defaultLanguage];
  const urlFor = (code: string) => `${SITE_URL}/${code}${path}`;
  const url = urlFor(locale);
  const image = `${SITE_URL}${OG_IMAGE.path}`;

  return {
    metadataBase: new URL(SITE_URL),
    title,
    description,
    icons: { icon: "/favicon.ico" },
    alternates: {
      canonical: url,
      languages: {
        ...Object.fromEntries(languages.map((lang) => [lang.code, urlFor(lang.code)])),
        "x-default": urlFor(defaultLanguage),
      },
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Perspective AI · AOSSIE",
      images: [{ url: image, width: OG_IMAGE.width, height: OG_IMAGE.height, alt: title }],
      locale: ogLocales[locale] ?? ogLocales[defaultLanguage],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      site: "@aossie_org",
      title,
      description,
      images: [image],
    },
  };
}

/**
 * schema.org JSON-LD describing the site and the web app, so search engines can show it as a free
 * web application published by AOSSIE. Only static facts: no ratings, counts or invented claims.
 */
export function generateStructuredData(locale: string) {
  const { title, description } = metadataCatalog[locale] ?? metadataCatalog[defaultLanguage];
  const lang = metadataCatalog[locale] ? locale : defaultLanguage;
  const url = `${SITE_URL}/${lang}`;
  const publisher = { "@type": "Organization", name: "AOSSIE", url: "https://aossie.org" };

  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", "@id": `${url}#website`, name: "Perspective AI", url, description, inLanguage: lang, publisher },
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: "Perspective AI",
        headline: title,
        description,
        url,
        applicationCategory: "ReferenceApplication",
        operatingSystem: "Any (web browser)",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        inLanguage: lang,
        publisher,
      },
    ],
  };
}

/** Serializes JSON-LD for a <script> tag; escaping "<" keeps the content from closing the tag early. */
export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

const pageCatalog = {
  about: { path: "/about", en: enMessages.About, hi: hiMessages.About },
  contribute: { path: "/contribute", en: enMessages.Contribute, hi: hiMessages.Contribute },
} as const;

export type PageKey = keyof typeof pageCatalog;

/** Sub-page metadata: its own title, description and canonical, sharing the site's alternates and image. */
export function generatePageMetadata(locale: string, page: PageKey): Metadata {
  const entry = pageCatalog[page];
  const copy = locale === "hi" ? entry.hi : entry.en;
  const base = generateLocaleMetadata(locale, entry.path);
  const title = `${copy.title} | Perspective AI`;
  return {
    ...base,
    title,
    description: copy.subtitle,
    openGraph: { ...base.openGraph, title, description: copy.subtitle },
    twitter: { ...base.twitter, title, description: copy.subtitle },
  };
}
