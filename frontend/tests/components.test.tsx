// Shared components: navbar, switchers, share button, buttons, meters and the navigation helpers.
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Navbar } from "@/components/navbar";
import LanguageSwitcher from "@/components/language-switcher";
import { ThemeToggle } from "@/components/theme-toggle";
import { SiteShareButton } from "@/components/site-share-button";
import { MarqueeTicker } from "@/components/marquee-ticker";
import BiasMeter from "@/components/bias-meter";
import { GetPerspectiveButton } from "@/components/get-perspective-button";
import { PerspectiveLogo } from "@/components/perspective-logo";
import { ArrowPointer } from "@/components/arrow-pointer";
import { FingerPointer } from "@/components/finger-pointer";
import { NavigationProgress } from "@/components/navigation-progress";
import { RoutePreloader } from "@/components/route-preloader";
import { SupportContent } from "@/components/support-content";
import { AOSSIE_URL, CONTACT_EMAIL, GITHUB_SPONSORS_URL, GSOC_URL, SOCIAL_LINKS, STABILITY_NEXUS_URL } from "@/config/links";
import { SHARE_PLATFORMS, SUPPORTERS } from "@/config/support";
import { IntlWrapper, renderWithIntl, catalogs } from "./helpers/intl";
import { nextRouter, setPathname } from "./helpers/next-navigation";

afterEach(() => {
  document.documentElement.className = "";
  document.documentElement.removeAttribute("style");
  localStorage.clear();
});

describe("Navbar", () => {
  const nav = catalogs.en.Navbar;

  it.each(["en", "hi"] as const)("links the %s pages and the AOSSIE community", (locale) => {
    renderWithIntl(<Navbar />, { locale, path: "/about" });
    const copy = catalogs[locale].Navbar;
    const desktop = screen.getAllByRole("navigation")[0];
    const links = within(desktop).getAllByRole("link");
    expect(links.map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      [copy.home, `/${locale}`],
      [copy.contribute, `/${locale}/contribute`],
      [copy.about, `/${locale}/about`],
      [copy.support, `/${locale}/support`],
    ]);
    // Only the current page is marked active
    expect(links[2].className).toContain("font-semibold");
    expect(links[0].className).not.toContain("font-semibold");

    for (const [label, href] of [
      ["Discord", SOCIAL_LINKS.discord],
      ["X (Twitter)", SOCIAL_LINKS.x],
      ["LinkedIn", SOCIAL_LINKS.linkedin],
      ["GitHub", SOCIAL_LINKS.github],
      ["YouTube", SOCIAL_LINKS.youtube],
    ]) {
      const link = screen.getByRole("link", { name: label });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(screen.getByRole("link", { name: "Email" })).toHaveAttribute("href", `mailto:${CONTACT_EMAIL}`);
  });

  it.each([
    ["en", "/support", "support"],
    ["hi", "/support", "support"],
    ["hi", "/about", "about"],
  ] as const)("in %s, marks the %s link active in the bar and in the mobile menu", (locale, path, key) => {
    renderWithIntl(<Navbar />, { locale, path });
    const copy = catalogs[locale].Navbar;
    const desktop = screen.getAllByRole("navigation")[0];
    const active = within(desktop)
      .getAllByRole("link")
      .filter((link) => link.className.includes("font-semibold"));
    expect(active.map((link) => link.getAttribute("href"))).toEqual([`/${locale}${path}`]);
    expect(active[0]).toHaveAccessibleName(copy[key]);

    fireEvent.click(screen.getByRole("button", { name: "Toggle Navigation Menu" }));
    const mobile = screen.getAllByRole("navigation")[1];
    const mobileActive = within(mobile)
      .getAllByRole("link")
      .filter((link) => link.className.split(" ").includes("bg-secondary"));
    expect(mobileActive.map((link) => link.getAttribute("href"))).toEqual([`/${locale}${path}`]);
  });

  it("shows the support link as a labelled heart below xl and leaves the legal pages out of the bar", () => {
    renderWithIntl(<Navbar />);
    const desktop = screen.getAllByRole("navigation")[0];
    const link = within(desktop).getByRole("link", { name: nav.support });
    // The label is visually hidden below xl, so the tooltip names the icon
    expect(link).toHaveAttribute("title", nav.support);
    expect(link.querySelector("span")).toHaveClass("sr-only", "xl:not-sr-only");
    const icon = link.querySelector("svg.lucide-heart")!;
    expect(icon).toHaveAttribute("aria-hidden", "true");
    // The heart stays next to the label from xl
    expect(icon.classList.contains("xl:hidden")).toBe(false);
    // Privacy Policy and Terms of Service are linked from the home page notice instead
    expect(within(desktop).queryByRole("link", { name: /privacy|terms/i })).toBeNull();
  });

  it("puts the share button right after the Perspective AI button and opens the share dialog", async () => {
    document.title = "Perspective navbar test";
    renderWithIntl(<Navbar />, { locale: "hi", path: "/about" });
    const share = screen.getByRole("button", { name: catalogs.hi.Share.trigger });
    const cta = screen.getByRole("link", { name: new RegExp(catalogs.hi.Navbar.perspectiveAi) });
    // Same group, directly after the CTA (the dialog's hidden mount point is skipped)
    expect(share.parentElement).toBe(cta.parentElement);
    const shown = Array.from(share.parentElement!.children).filter((el) => !(el as HTMLElement).hidden);
    expect(shown.indexOf(share)).toBe(shown.indexOf(cta) + 1);
    expect(share).toHaveClass("w-9", "h-9", "rounded-lg", "border-border");
    // Visible at every width: no responsive hiding on the button or its group
    expect(share.className.split(" ")).not.toContain("hidden");
    expect(share.parentElement!.className.split(" ")).not.toContain("hidden");

    const overlay = await waitFor(() => {
      const el = document.querySelector<HTMLElement>(".social-share-modal-overlay");
      expect(el).not.toBeNull();
      return el!;
    });
    expect(overlay.style.display).toBe("none");
    fireEvent.click(share);
    expect(overlay.style.display).toBe("flex");
    expect(overlay.querySelector("h3")).toHaveTextContent(catalogs.hi.Share.share);
  });

  it("marks Home active only on the home page", () => {
    renderWithIntl(<Navbar />);
    const [home, contribute] = within(screen.getAllByRole("navigation")[0]).getAllByRole("link");
    expect(home.className).toContain("font-semibold");
    expect(contribute.className).not.toContain("font-semibold");
  });

  it("highlights a clicked link straight away, before the route changes", () => {
    renderWithIntl(<Navbar />);
    const desktop = screen.getAllByRole("navigation")[0];
    const contribute = within(desktop).getByRole("link", { name: nav.contribute });
    fireEvent.click(contribute);
    expect(contribute.className).toContain("font-semibold");
    expect(within(desktop).getByRole("link", { name: nav.home }).className).not.toContain("font-semibold");
  });

  it("opens and closes the mobile menu with the toggle, the backdrop and a link", () => {
    const { container } = renderWithIntl(<Navbar />, { path: "/contribute" });
    const toggle = screen.getByRole("button", { name: "Toggle Navigation Menu" });
    expect(screen.getAllByRole("navigation")).toHaveLength(1);

    fireEvent.click(toggle);
    const mobile = screen.getAllByRole("navigation")[1];
    expect(within(mobile).getByRole("link", { name: nav.contribute }).className).toContain("bg-secondary");
    // The support page follows the main links, with its heart icon; the legal pages are not in the menu
    expect(within(mobile).getAllByRole("link").map((a) => [a.textContent, a.getAttribute("href")])).toEqual([
      [nav.home, "/en"],
      [nav.contribute, "/en/contribute"],
      [nav.about, "/en/about"],
      [nav.support, "/en/support"],
    ]);
    expect(within(mobile).getByRole("link", { name: nav.support }).querySelector(".lucide-heart")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    // The mobile menu has its own copy of the social links
    expect(screen.getAllByRole("link", { name: "Discord" })).toHaveLength(2);
    fireEvent.click(toggle);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);

    fireEvent.click(toggle);
    fireEvent.click(container.querySelector(".backdrop-blur-xs")!);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);

    fireEvent.click(toggle);
    fireEvent.click(within(screen.getAllByRole("navigation")[1]).getByRole("link", { name: nav.about }));
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("closes the mobile menu when the route changes", () => {
    const { rerender } = renderWithIntl(<Navbar />);
    fireEvent.click(screen.getByRole("button", { name: "Toggle Navigation Menu" }));
    expect(screen.getAllByRole("navigation")).toHaveLength(2);
    setPathname("/en/about");
    rerender(<Navbar />);
    expect(screen.getAllByRole("navigation")).toHaveLength(1);
  });

  it("on the home page, Perspective AI focuses the article input instead of navigating", () => {
    renderWithIntl(<Navbar />);
    const listener = vi.fn();
    window.addEventListener("perspective:prompt-input", listener);
    const cta = screen.getByRole("button", { name: new RegExp(nav.perspectiveAi) });
    fireEvent.click(cta);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(nextRouter.push).not.toHaveBeenCalled();
    window.removeEventListener("perspective:prompt-input", listener);
  });

  it("elsewhere, Perspective AI links to the home page and asks it to focus the input", () => {
    renderWithIntl(<Navbar />, { locale: "hi", path: "/about" });
    const cta = screen.getByRole("link", { name: new RegExp(catalogs.hi.Navbar.perspectiveAi) });
    expect(cta).toHaveAttribute("href", "/hi?focus=true");
    fireEvent.click(cta);
    expect(nextRouter.push).toHaveBeenCalledWith("/hi?focus=true");
  });
});

describe("LanguageSwitcher", () => {
  it("shows the current language and switches to another one on the same page", async () => {
    renderWithIntl(<LanguageSwitcher />, { path: "/about" });
    const trigger = screen.getByRole("button", { name: /en/i });
    expect(trigger).toHaveTextContent("en");
    expect(screen.queryByText("हिन्दी")).toBeNull();

    await userEvent.click(trigger);
    const english = screen.getByRole("button", { name: /English/ });
    expect(english.className).toContain("bg-primary");
    await userEvent.click(screen.getByRole("button", { name: /Hindi/ }));
    expect(nextRouter.replace).toHaveBeenCalledWith("/hi/about");
    expect(screen.queryByText("हिन्दी")).toBeNull();
  });

  it("closes when the reader clicks outside it but not inside it", () => {
    renderWithIntl(
      <div>
        <LanguageSwitcher className="extra" />
        <p>outside</p>
      </div>,
      { locale: "hi" },
    );
    fireEvent.click(screen.getByRole("button", { name: /hi/i }));
    expect(screen.getByRole("button", { name: /Hindi/ }).className).toContain("bg-primary");
    fireEvent.mouseDown(screen.getByRole("button", { name: /English/ }));
    expect(screen.getByText("हिन्दी")).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText("outside"));
    expect(screen.queryByText("हिन्दी")).toBeNull();
  });

  it("falls back to the first language for an unknown locale", () => {
    render(
      <NextIntlClientProvider locale="fr" messages={catalogs.en}>
        <LanguageSwitcher />
      </NextIntlClientProvider>,
    );
    expect(screen.getByRole("button")).toHaveTextContent("en");
  });
});

describe("ThemeToggle", () => {
  it("renders a placeholder until mounted, so server and client markup match", () => {
    const html = renderToStaticMarkup(
      <IntlWrapper>
        <ThemeToggle className="x" />
      </IntlWrapper>,
    );
    expect(html).toContain("animate-pulse");
    expect(html).not.toContain("<button");
  });

  it("toggles between dark and light and labels the button", async () => {
    renderWithIntl(<ThemeToggle />, { locale: "hi" });
    const button = screen.getByRole("button", { name: catalogs.hi.ThemeToggle.toggleTheme });
    expect(document.documentElement).toHaveClass("dark");
    expect(button.querySelector(".lucide-sun")).not.toBeNull();

    await userEvent.click(button);
    expect(document.documentElement).toHaveClass("light");
    expect(button.querySelector(".lucide-moon")).not.toBeNull();
    await userEvent.click(button);
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("SiteShareButton", () => {
  const overlays = () => Array.from(document.querySelectorAll<HTMLElement>(".social-share-modal-overlay"));

  it("opens a localized share dialog for the current page and closes it with Escape", async () => {
    document.title = "Perspective test page";
    renderWithIntl(
      <>
        <SiteShareButton className="share" />
        <ThemeToggle />
      </>,
      { locale: "hi" },
    );
    const share = catalogs.hi.Share;
    await waitFor(() => expect(overlays()).toHaveLength(1));
    const [overlay] = overlays();
    expect(overlay).toHaveClass("dark");
    expect(overlay.style.display).toBe("none");
    expect(overlay.querySelector("h3")).toHaveTextContent(share.share);
    expect(overlay.querySelector(".social-share-modal-close")).toHaveAttribute("aria-label", share.close);
    expect(overlay.querySelector(".social-share-copy-btn")).toHaveTextContent(share.copy);
    const platforms = Array.from(overlay.querySelectorAll("[data-platform]")).map((el) => el.getAttribute("data-platform"));
    expect(platforms).toEqual([...SHARE_PLATFORMS]);

    const trigger = screen.getByRole("button", { name: share.trigger });
    expect(trigger).toHaveAttribute("title", share.trigger);
    fireEvent.click(trigger);
    expect(overlay.style.display).toBe("flex");
    expect(overlay.querySelector<HTMLInputElement>(".social-share-link-input input")!.value).toBe(window.location.href);

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(overlay.style.display).toBe("none"));
  });

  it("rebuilds the dialog in the new theme and removes it on unmount", async () => {
    const { unmount } = renderWithIntl(
      <>
        <SiteShareButton className="share" />
        <ThemeToggle />
      </>,
    );
    await waitFor(() => expect(overlays()).toHaveLength(1));
    await userEvent.click(screen.getByRole("button", { name: catalogs.en.ThemeToggle.toggleTheme }));
    await waitFor(() => expect(overlays()[0]).toHaveClass("light"));
    expect(overlays()).toHaveLength(1);
    unmount();
    expect(overlays()).toHaveLength(0);
  });

  it("does nothing when clicked before the dialog has loaded", () => {
    renderWithIntl(<SiteShareButton className="share" />);
    fireEvent.click(screen.getByRole("button", { name: catalogs.en.Share.trigger }));
    expect(overlays().every((overlay) => overlay.style.display !== "flex")).toBe(true);
  });
});

describe("MarqueeTicker", () => {
  it("repeats every localized feature four times for a seamless loop", () => {
    renderWithIntl(<MarqueeTicker />, { locale: "hi" });
    for (const text of Object.values(catalogs.hi.Ticker)) {
      expect(screen.getAllByText(text)).toHaveLength(4);
    }
  });
});

describe("BiasMeter", () => {
  it.each([
    [0, "lowBias", "text-success"],
    [30, "lowBias", "text-success"],
    [31, "moderateBias", "text-warning"],
    [60, "moderateBias", "text-warning"],
    [61, "highBias", "text-destructive"],
    [100, "highBias", "text-destructive"],
  ] as const)("score %i reads as %s", (score, label, color) => {
    renderWithIntl(<BiasMeter score={score} />);
    expect(screen.getByText(catalogs.en.BiasMeter[label])).toBeInTheDocument();
    expect(screen.getByText(`${score}/100`)).toHaveClass(color);
  });

  it("treats a missing score as 0 and fills the ring in proportion to the score", () => {
    const { container, rerender } = renderWithIntl(<BiasMeter score={undefined as unknown as number} />);
    expect(screen.getByText("0/100")).toBeInTheDocument();
    const ring = () => Number(container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"));
    const circumference = 2 * Math.PI * 45;
    expect(ring()).toBeCloseTo(circumference);
    rerender(<BiasMeter score={50} />);
    expect(ring()).toBeCloseTo(circumference / 2);
  });
});

describe("GetPerspectiveButton", () => {
  it("is a button with the logo and the localized default label", () => {
    const onClick = vi.fn();
    const { container } = renderWithIntl(<GetPerspectiveButton onClick={onClick} aria-label="go" />, { locale: "hi" });
    const button = screen.getByRole("button", { name: "go" });
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveTextContent(catalogs.hi.Common.getPerspective);
    expect(container.querySelector("svg")).toHaveClass("h-3.5");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("becomes a locale-aware link when given an href", () => {
    renderWithIntl(
      <GetPerspectiveButton href="/about" size="sm" target="_self" rel="next" iconRight={<span>→</span>}>
        Read
      </GetPerspectiveButton>,
    );
    const link = screen.getByRole("link", { name: /Read/ });
    expect(link).toHaveAttribute("href", "/en/about");
    expect(link).toHaveAttribute("target", "_self");
    expect(link).toHaveTextContent("→");
    expect(link.querySelector("svg")).toHaveClass("h-3");
  });

  it("shows the current step and disables itself while loading, even with an href", () => {
    const { rerender } = renderWithIntl(<GetPerspectiveButton href="/about" isLoading loadingStepText="Checking Facts..." />);
    expect(screen.queryByRole("link")).toBeNull();
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent("Checking Facts...");
    expect(button.querySelector("svg")).toBeNull();
    rerender(<GetPerspectiveButton isLoading />);
    expect(screen.getByRole("button")).toHaveTextContent("Analysing...");
  });

  it("can hide the logo, be disabled and use the topic style", () => {
    const { container, rerender } = renderWithIntl(<GetPerspectiveButton showLogo={false} disabled type="submit" size="lg" />);
    expect(container.querySelector("svg")).toBeNull();
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
    rerender(<GetPerspectiveButton variant="topic" logoClassName="logo" />);
    expect(screen.getByRole("button").className).toContain("bg-topic-bg");
    expect(container.querySelector("svg")).toHaveClass("logo");
    expect(container.querySelector("path")).toHaveAttribute("stroke", "currentColor");
  });
});

describe("decorative SVGs", () => {
  it("the logo follows the theme tokens, or the text colour on topic buttons", () => {
    const { container, rerender } = render(<PerspectiveLogo />);
    expect(container.querySelector("svg")).toHaveClass("h-4");
    expect(container.querySelector("path")).toHaveAttribute("stroke", "var(--logo-stroke)");
    expect(container.querySelector("rect")).toHaveAttribute("fill", "var(--logo-fill)");
    rerender(<PerspectiveLogo variant="topic" className="big" />);
    expect(container.querySelector("svg")).toHaveClass("big");
    expect(container.querySelector("rect")).toHaveAttribute("fill", "currentColor");
  });

  it("the pointers take a class and size and stay hidden from screen readers", () => {
    const { container, rerender } = render(<ArrowPointer />);
    expect(container.querySelector("svg")).toHaveClass("w-5");
    rerender(<ArrowPointer className="arrow" />);
    expect(container.querySelector("svg")).toHaveClass("arrow");

    rerender(<FingerPointer />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "28");
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    rerender(<FingerPointer size={40} className="finger" />);
    expect(container.querySelector("svg")).toHaveAttribute("height", "40");
    expect(container.querySelector("svg")).toHaveClass("finger");
  });
});

describe("NavigationProgress", () => {
  // The progress bar listens for clicks on any anchor, so these are deliberately plain <a> elements
  /* eslint-disable @next/next/no-html-link-for-pages */
  function setup() {
    vi.useFakeTimers();
    window.history.replaceState({}, "", "/en");
    const tree = () => (
      <>
        <NavigationProgress />
        <a href="/en/about">about</a>
        <a href="/en/about?x=1#top">about-query</a>
        <a href="/en">same page</a>
        <a href="https://example.com">external</a>
        <a href="mailto:a@b.c">mail</a>
        <a href="tel:123">phone</a>
        <a href="/en/terms" target="_blank">new tab</a>
        <a href="/en/terms" rel="external">rel external</a>
        <a>no href</a>
        <span>not a link</span>
      </>
    );
    const utils = renderWithIntl(tree());
    const bar = () => utils.container.querySelector<HTMLElement>("[aria-hidden='true'] > div");
    return { ...utils, bar, rerenderSame: () => utils.rerender(tree()) };
  }
  /* eslint-enable @next/next/no-html-link-for-pages */

  const click = (name: string, init: MouseEventInit = {}) => fireEvent.click(screen.getByText(name), init);

  it.each([
    ["same page", {}],
    ["external", {}],
    ["mail", {}],
    ["phone", {}],
    ["new tab", {}],
    ["rel external", {}],
    ["no href", {}],
    ["not a link", {}],
    ["about", { ctrlKey: true }],
    ["about", { metaKey: true }],
    ["about", { shiftKey: true }],
    ["about", { altKey: true }],
  ])("ignores a click on %s %j", (name, init) => {
    const { bar } = setup();
    click(name, init);
    expect(bar()).toBeNull();
  });

  it("starts at 28% on an internal link, creeps towards 88% and completes when the route changes", () => {
    const { bar, rerenderSame } = setup();
    click("about-query");
    expect(bar()!.style.width).toBe("28%");
    act(() => {
      vi.advanceTimersByTime(120);
    });
    expect(bar()!.style.width).toBe("44%");
    act(() => {
      vi.advanceTimersByTime(120 * 20);
    });
    expect(bar()!.style.width).toBe("88%");
    // A second click restarts the animation
    click("about");
    expect(bar()!.style.width).toBe("28%");

    setPathname("/en/about");
    rerenderSame();
    expect(bar()!.style.width).toBe("100%");
    expect(bar()!.style.opacity).toBe("0");
    act(() => {
      vi.advanceTimersByTime(250);
    });
    expect(bar()).toBeNull();
  });
});

describe("RoutePreloader", () => {
  it("prefetches the heavy visuals when the browser is idle and cancels on unmount", async () => {
    let idle: (() => void) | undefined;
    window.requestIdleCallback = vi.fn((callback: IdleRequestCallback) => {
      idle = () => callback({ didTimeout: false, timeRemaining: () => 50 });
      return 7;
    });
    window.cancelIdleCallback = vi.fn();
    const { container, unmount } = render(<RoutePreloader />);
    expect(container).toBeEmptyDOMElement();
    expect(idle).toBeTypeOf("function");
    await act(async () => idle!());
    unmount();
    expect(window.cancelIdleCallback).toHaveBeenCalledWith(7);
    // @ts-expect-error restore the jsdom default (no idle callbacks)
    delete window.requestIdleCallback;
    // @ts-expect-error see above
    delete window.cancelIdleCallback;
  });

  it("falls back to a 1.2s timer without requestIdleCallback", () => {
    vi.useFakeTimers();
    expect(window.requestIdleCallback).toBeUndefined();
    const { unmount } = render(<RoutePreloader />);
    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("runs the timer fallback's prefetch", async () => {
    vi.useFakeTimers();
    render(<RoutePreloader />);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1200);
    });
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("SupportContent", () => {
  it("renders the support widget in the reader's language", () => {
    renderWithIntl(<SupportContent />, { locale: "hi" });
    const support = catalogs.hi.Support;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(support.title);
    expect(screen.getByText(support.madeBy)).toBeInTheDocument();
    expect(screen.getByText(support.supportedBy)).toBeInTheDocument();
    expect(screen.getByText(support.aossieDescription)).toBeInTheDocument();
    expect(screen.getByText(catalogs.hi.Metadata.description)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AOSSIE/ })).toHaveAttribute("href", AOSSIE_URL);
  });

  it("lists Google Summer of Code and Stability Nexus as supporters, linked and without a tier", () => {
    renderWithIntl(<SupportContent />);
    expect(SUPPORTERS.map((s) => s.name)).toEqual(["Google Summer of Code", "Stability Nexus"]);
    for (const [name, href] of [
      ["Google Summer of Code", GSOC_URL],
      ["Stability Nexus", STABILITY_NEXUS_URL],
    ]) {
      const link = screen.getByRole("link", { name: new RegExp(name) });
      expect(link).toHaveAttribute("href", href);
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
    expect(GSOC_URL).toBe("https://summerofcode.withgoogle.com");
    expect(STABILITY_NEXUS_URL).toBe("https://stability.nexus");
    expect(document.body.textContent).not.toMatch(/Platinum|Gold|Silver|Bronze/);
  });

  it("opens GitHub Sponsors in a new tab from the call to action", () => {
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    renderWithIntl(<SupportContent />);
    fireEvent.click(screen.getByRole("button", { name: "GitHub Sponsors" }));
    expect(open).toHaveBeenCalledWith(GITHUB_SPONSORS_URL, "_blank", "noopener,noreferrer");
    open.mockRestore();
  });
});
