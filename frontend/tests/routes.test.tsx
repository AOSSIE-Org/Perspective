// Route entry files: layouts, redirects, metadata and the server-rendered pages (privacy, terms, support).
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { createTranslator } from "next-intl";
import { renderWithIntl, catalogs } from "./helpers/intl";
import { NavigationSignal, notFound, redirect } from "./helpers/next-navigation";
import { SITE_URL } from "@/config/site";
import { themeInitScript } from "@/components/theme-script";

// The server half of next-intl needs the Next.js request scope; translations come from the real catalogs
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getRequestConfig: (factory: unknown) => factory,
  getTranslations: async ({ locale, namespace }: { locale: "en" | "hi"; namespace: string }) =>
    createTranslator({ locale, messages: catalogs[locale], namespace: namespace as never }),
}));

// The support widget is a third-party component; it gets its own test in components.test.tsx
vi.mock("@aossie-org/support-us-button", () => ({
  default: ({ heading }: { heading: string }) => <section data-testid="support-widget">{heading}</section>,
}));

/** A page that returns an async server component element: run that component as the RSC renderer would. */
async function renderServerElement(element: ReactElement) {
  const component = element.type as (props: unknown) => Promise<ReactElement>;
  return renderToStaticMarkup(await component(element.props));
}

const params = (locale: string) => ({ params: Promise.resolve({ locale }) });

async function expectNavigation(run: () => unknown, kind: "redirect" | "notFound") {
  let caught: unknown;
  try {
    await run();
  } catch (error) {
    caught = error;
  }
  expect(caught).toBeInstanceOf(NavigationSignal);
  expect((caught as NavigationSignal).kind).toBe(kind);
  return caught as NavigationSignal;
}

describe("root routes (outside a locale)", () => {
  it("the root layout passes its children through unchanged", async () => {
    const { default: RootLayout } = await import("@/app/layout");
    const child = <p>child</p>;
    expect(RootLayout({ children: child })).toBe(child);
  });

  it("/ forwards to the default locale by script, meta refresh and a no-JS link", async () => {
    const { default: RootPage, metadata } = await import("@/app/page");
    const html = renderToStaticMarkup(<RootPage />);
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('<script>location.replace("/en")</script>');
    expect(html).toContain('<meta http-equiv="refresh" content="0; url=/en"/>');
    expect(html).toContain('<a href="/en">Continue to Perspective AI</a>');
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/en`);
  });

  it("an unknown path outside a locale redirects to the default locale", async () => {
    const { default: RootNotFound } = await import("@/app/not-found");
    const signal = await expectNavigation(() => RootNotFound(), "redirect");
    expect(signal.url).toBe("/en");
    expect(redirect).toHaveBeenCalledTimes(1);
  });
});

describe("locale layout", () => {
  it("pre-renders one page tree per configured locale", async () => {
    const { generateStaticParams, dynamicParams } = await import("@/app/[locale]/layout");
    expect(generateStaticParams()).toEqual([{ locale: "en" }, { locale: "hi" }]);
    expect(dynamicParams).toBe(false);
  });

  it.each(["en", "hi"] as const)("builds the %s metadata from that catalog", async (locale) => {
    const { generateMetadata } = await import("@/app/[locale]/layout");
    const metadata = await generateMetadata(params(locale));
    expect(metadata.title).toBe(catalogs[locale].Metadata.title);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/${locale}`);
  });

  it("404s an unknown locale in metadata and in the layout", async () => {
    const { default: LocaleLayout, generateMetadata } = await import("@/app/[locale]/layout");
    await expectNavigation(() => generateMetadata(params("fr")), "notFound");
    await expectNavigation(() => LocaleLayout({ children: null, ...params("fr") }), "notFound");
    expect(notFound).toHaveBeenCalledTimes(2);
  });

  it.each([
    ["en", "HOME", catalogs.en.Navbar.support],
    ["hi", catalogs.hi.Navbar.home, catalogs.hi.Navbar.support],
  ] as const)("renders the %s shell: html lang, JSON-LD, the navbar with its support link, and the page", async (locale, home, support) => {
    const { default: LocaleLayout } = await import("@/app/[locale]/layout");
    const tree = (await LocaleLayout({ children: <p>page body</p>, ...params(locale) })) as ReactElement;
    const html = renderToStaticMarkup(tree);
    expect(html).toContain(`<html lang="${locale}"`);
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).toContain(`"inLanguage":"${locale}"`);
    expect(html).toContain("page body");
    expect(html).toContain(home);
    expect(html).toContain(support);
    expect(html).toContain(`href="/${locale}/support"`);
    // The theme is applied from <head>, before <body> exists, so the first paint is never the wrong theme
    const head = new DOMParser().parseFromString(html, "text/html").head;
    expect(head.querySelector("script")?.textContent).toBe(themeInitScript);
  });
});

describe("locale-level fallback pages", () => {
  it("shows a loading indicator", async () => {
    const { default: Loading } = await import("@/app/[locale]/loading");
    render(<Loading />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("the error page logs the error and retries on click", async () => {
    const { default: ErrorPage } = await import("@/app/[locale]/error");
    const error = new Error("boom");
    const reset = vi.fn();
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithIntl(<ErrorPage error={error} reset={reset} />, { locale: "hi" });
    expect(screen.getByRole("heading", { name: catalogs.hi.Error.title })).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith(error);
    await userEvent.click(screen.getByRole("button", { name: catalogs.hi.Error.retry }));
    expect(reset).toHaveBeenCalledTimes(1);
    log.mockRestore();
  });

  it("the 404 page links back to the locale home", async () => {
    const { default: NotFound } = await import("@/app/[locale]/not-found");
    renderWithIntl(<NotFound />, { locale: "hi" });
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(`404 - ${catalogs.hi.NotFound.title}`);
    expect(screen.getByRole("link", { name: catalogs.hi.NotFound.home })).toHaveAttribute("href", "/hi");
  });

  it("the impact page is switched off and 404s", async () => {
    const { default: ImpactPage } = await import("@/app/[locale]/impact/page");
    await expectNavigation(() => ImpactPage(), "notFound");
  });

  it("/[locale]/analyze forwards to the locale home and is not indexed", async () => {
    const { default: AnalyzeIndexPage, metadata } = await import("@/app/[locale]/analyze/page");
    const html = renderToStaticMarkup(await AnalyzeIndexPage(params("hi")));
    expect(html).toContain('content="0; url=/hi"');
    expect(html).toContain('<a href="/hi" class="underline">Continue</a>');
    expect(metadata.robots).toEqual({ index: false, follow: true });
  });
});

describe("page metadata layouts", () => {
  it.each([
    ["about", "@/app/[locale]/about/layout"],
    ["contribute", "@/app/[locale]/contribute/layout"],
  ] as const)("%s declares its own title and canonical and passes children through", async (page, modulePath) => {
    const mod =
      modulePath === "@/app/[locale]/about/layout"
        ? await import("@/app/[locale]/about/layout")
        : await import("@/app/[locale]/contribute/layout");
    const metadata = await mod.generateMetadata(params("hi"));
    const copy = page === "about" ? catalogs.hi.About : catalogs.hi.Contribute;
    expect(metadata.title).toBe(`${copy.title} | Perspective AI`);
    expect(metadata.alternates?.canonical).toBe(`${SITE_URL}/hi/${page}`);
    const child = <p>x</p>;
    expect(mod.default({ children: child })).toBe(child);
  });
});

describe("legal pages", () => {
  it.each([
    ["privacy", "Privacy Policy"],
    ["terms", "Terms of Service"],
  ] as const)("%s renders the repository document with localized links and metadata", async (page, title) => {
    const mod = page === "privacy" ? await import("@/app/[locale]/privacy/page") : await import("@/app/[locale]/terms/page");
    expect((await mod.generateMetadata(params("en"))).title).toBe(`${title} | Perspective AI`);

    const html = await renderServerElement(await mod.default(params("en")));
    expect(html).toMatch(new RegExp(`<h1[^>]*>[^<]*${title.split(" ")[0]}`));
    expect(html).not.toContain(catalogs.en.Legal.englishOnly);
  });

  it("tells Hindi readers the document is English-only and links to the Hindi pages", async () => {
    const { default: TermsPage } = await import("@/app/[locale]/terms/page");
    // TERMS.md links to PRIVACY.md, which must become the Hindi privacy page
    const html = await renderServerElement(await TermsPage(params("hi")));
    expect(html).toContain(catalogs.hi.Legal.englishOnly);
    expect(html).toContain('lang="en"');
    expect(html).toContain('href="/hi/privacy"');
  });
});

describe("support page", () => {
  it("inlines the widget stylesheet without cascade layers and renders the widget", async () => {
    const { default: SupportPage, generateMetadata } = await import("@/app/[locale]/support/page");
    expect((await generateMetadata(params("hi"))).title).toBe(`${catalogs.hi.Support.title} | Perspective AI`);

    const tree = await SupportPage(params("en"));
    const { container } = renderWithIntl(tree);
    const style = container.querySelector("style");
    expect(style?.innerHTML).toContain(".sub-root");
    expect(style?.innerHTML).not.toMatch(/@layer\s/);
    expect(screen.getByTestId("support-widget")).toHaveTextContent(catalogs.en.Support.title);
  });
});

describe("i18n request config", () => {
  type RequestConfigFactory = (args: { requestLocale: Promise<string | undefined> }) => Promise<{
    locale: string;
    messages: unknown;
  }>;

  it.each([
    ["hi", "hi", catalogs.hi],
    ["en", "en", catalogs.en],
    ["fr", "en", catalogs.en],
    [undefined, "en", catalogs.en],
  ] as const)("requested locale %s resolves to %s with its catalog", async (requested, locale, messages) => {
    const factory = (await import("@/i18n/request")).default as unknown as RequestConfigFactory;
    const config = await factory({ requestLocale: Promise.resolve(requested) });
    expect(config.locale).toBe(locale);
    expect(config.messages).toBe(messages);
  });
});
