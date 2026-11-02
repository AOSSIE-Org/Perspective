/**
 * Shared test setup. Adds the jest-dom matchers and stands in for what jsdom and a plain Vitest run lack:
 * the Next.js router and image optimizer, `next/dynamic`, and the browser APIs the components call
 * (matchMedia, ResizeObserver, IntersectionObserver, scrollTo). Everything else (next-intl, next-themes,
 * motion, the real message catalogs) runs for real.
 */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { resetNextNavigation } from "./helpers/next-navigation";

vi.mock("next/navigation", async () => {
  const state = await import("./helpers/next-navigation");
  return {
    useRouter: () => state.nextRouter,
    usePathname: () => state.navigationState.pathname,
    useSearchParams: () => new URLSearchParams(state.navigationState.search),
    useParams: () => ({ locale: state.navigationState.locale }),
    redirect: state.redirect,
    permanentRedirect: state.redirect,
    notFound: state.notFound,
    RedirectType: { push: "push", replace: "replace" },
  };
});

// next/image needs the optimizer; a plain <img> keeps src, alt and size for assertions
vi.mock("next/image", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ src, alt, width, height, className, ...rest }: Record<string, unknown>) =>
      createElement("img", {
        src: typeof src === "string" ? src : "",
        alt,
        width,
        height,
        className,
        "aria-hidden": rest["aria-hidden"],
      }),
  };
});

// next/dynamic: load the component with React.lazy and show the `loading` fallback meanwhile
vi.mock("next/dynamic", async () => {
  const React = await import("react");
  return {
    default: (
      loader: () => Promise<React.ComponentType | { default: React.ComponentType }>,
      options: { loading?: () => React.ReactNode } = {},
    ) => {
      const Lazy = React.lazy(async () => {
        const loaded = await loader();
        return { default: "default" in loaded ? loaded.default : loaded };
      });
      const Fallback = options.loading;
      return function DynamicComponent(props: Record<string, unknown>) {
        return React.createElement(
          React.Suspense,
          { fallback: Fallback ? React.createElement(Fallback) : null },
          React.createElement(Lazy, props),
        );
      };
    },
  };
});

// next/font only works inside the Next.js compiler
vi.mock("next/font/google", () => ({
  Inter: () => ({ variable: "font-inter", className: "font-inter" }),
}));

class MockResizeObserver {
  static instances: MockResizeObserver[] = [];
  observed: Element[] = [];
  constructor(public callback: ResizeObserverCallback) {
    MockResizeObserver.instances.push(this);
  }
  observe(target: Element) {
    this.observed.push(target);
  }
  unobserve() {}
  disconnect() {
    this.observed = [];
  }
}

class MockIntersectionObserver {
  constructor(public callback: IntersectionObserverCallback) {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

Object.assign(globalThis, {
  ResizeObserver: MockResizeObserver,
  IntersectionObserver: MockIntersectionObserver,
});

if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

window.scrollTo = (() => {}) as typeof window.scrollTo;

afterEach(() => {
  cleanup();
  resetNextNavigation();
  sessionStorage.clear();
  vi.useRealTimers();
});

// jsdom cannot load another document and logs "Not implemented: navigation" when a link is followed; the
// components' own click handlers still run (this listener is the last one, on window, in the bubble phase)
window.addEventListener("click", (event) => {
  if ((event.target as Element | null)?.closest?.("a[href]")) event.preventDefault();
});
