import { describe, it, expect } from "vitest";
import fc from "fast-check";
import sitemap from "@/app/sitemap";
import {
  generateLocaleMetadata,
  generatePageMetadata,
  generateStructuredData,
  serializeJsonLd,
  type PageKey,
} from "@/i18n/metadata";
import { routing } from "@/i18n/routing";
import { languages, defaultLanguage } from "@/config/languages";
import { SITE_URL, PUBLIC_PAGES, OG_IMAGE } from "@/config/site";
import en from "@/messages/en.json";
import hi from "@/messages/hi.json";

const codes = languages.map((l) => l.code);
const sitemapUrls = () => sitemap().map((e) => e.url);

describe("locale routing", () => {
  it("routes every configured language with English as default", () => {
    expect(routing.locales).toEqual(codes);
    expect(routing.defaultLocale).toBe(defaultLanguage);
  });
});

describe("sitemap", () => {
  it("lists every public page in every locale and leaves out the per-user analyze flow", () => {
    const urls = sitemapUrls();
    expect(urls).toHaveLength(codes.length * PUBLIC_PAGES.length);
    expect(urls).toContain(`${SITE_URL}/en/about`);
    expect(urls.some((u) => u.includes("/analyze"))).toBe(false);
    expect(urls.some((u) => u.includes("/impact"))).toBe(false);
  });
});

describe("generateLocaleMetadata", () => {
  it.each([
    ["en", en],
    ["hi", hi],
  ] as const)("uses the %s catalog", (code, catalog) => {
    const meta = generateLocaleMetadata(code);
    expect(meta.title).toBe(catalog.Metadata.title);
    expect(meta.description).toBe(catalog.Metadata.description);
  });

  it("falls back to English for an unknown locale", () => {
    expect(generateLocaleMetadata("xx").title).toBe(en.Metadata.title);
    expect(generateLocaleMetadata("xx").openGraph).toMatchObject({ locale: "en_US" });
  });

  it("declares canonical, hreflang alternates and x-default", () => {
    const meta = generateLocaleMetadata("hi");
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/hi`);
    expect(meta.alternates?.languages).toEqual({ en: `${SITE_URL}/en`, hi: `${SITE_URL}/hi`, "x-default": `${SITE_URL}/en` });
  });

  it("shares a 1200x630 raster image on Open Graph and X", () => {
    const meta = generateLocaleMetadata("en");
    const [image] = meta.openGraph?.images as { url: string; width: number; height: number }[];
    expect(image).toMatchObject({ url: `${SITE_URL}${OG_IMAGE.path}`, width: 1200, height: 630 });
    expect(meta.twitter).toMatchObject({ card: "summary_large_image", images: [image.url] });
  });
});

describe("generatePageMetadata", () => {
  const pages: PageKey[] = ["about", "contribute"];

  it.each(pages)("gives /%s its own title, description and canonical", (page) => {
    const meta = generatePageMetadata("en", page);
    const copy = page === "about" ? en.About : en.Contribute;
    expect(meta.title).toBe(`${copy.title} | Perspective AI`);
    expect(meta.description).toBe(copy.subtitle);
    expect(meta.alternates?.canonical).toBe(`${SITE_URL}/en/${page}`);
    expect(meta.openGraph).toMatchObject({ title: meta.title, url: `${SITE_URL}/en/${page}` });
  });

  it("uses Hindi copy on Hindi pages", () => {
    expect(generatePageMetadata("hi", "about").title).toBe(`${hi.About.title} | Perspective AI`);
  });

  it("property: every page/locale canonical is listed in the sitemap", () => {
    const urls = new Set(sitemapUrls());
    fc.assert(
      fc.property(fc.constantFrom(...pages), fc.constantFrom(...codes), (page, code) => {
        expect(urls.has(generatePageMetadata(code, page).alternates?.canonical as string)).toBe(true);
        expect(urls.has(generateLocaleMetadata(code).alternates?.canonical as string)).toBe(true);
      }),
    );
  });
});

describe("structured data (JSON-LD)", () => {
  it.each(codes)("describes the %s site and web app with the localized description", (code) => {
    const data = generateStructuredData(code);
    const [site, app] = data["@graph"];
    const description = (code === "hi" ? hi : en).Metadata.description;
    expect(data["@context"]).toBe("https://schema.org");
    expect(site).toMatchObject({ "@type": "WebSite", url: `${SITE_URL}/${code}`, inLanguage: code, description });
    expect(app).toMatchObject({ "@type": "WebApplication", isAccessibleForFree: true, offers: { price: "0" } });
    expect(app.publisher).toEqual({ "@type": "Organization", name: "AOSSIE", url: "https://aossie.org" });
  });

  it("points at the canonical URL that the page metadata declares", () => {
    const canonical = generateLocaleMetadata("en").alternates?.canonical;
    expect(generateStructuredData("en")["@graph"][0].url).toBe(canonical);
  });

  it("falls back to English for an unknown locale", () => {
    const [site] = generateStructuredData("xx")["@graph"];
    expect(site).toMatchObject({ url: `${SITE_URL}/en`, inLanguage: "en", description: en.Metadata.description });
  });

  it("property: serialized JSON-LD round-trips and can never close its <script> tag early", () => {
    fc.assert(
      fc.property(fc.string(), (text) => {
        const json = serializeJsonLd({ text });
        expect(json).not.toContain("<");
        expect(JSON.parse(json)).toEqual({ text });
      }),
    );
  });
});
