import { vi } from "vitest";

/** State behind the `next/navigation` mock in tests/setup.ts. Tests set the current path and read router calls. */
export const navigationState = {
  /** Full pathname including the locale prefix, as Next.js reports it (e.g. "/en/about"). */
  pathname: "/en",
  search: "",
  locale: "en",
};

export const nextRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
};

/** Thrown by the mocked `redirect()` / `notFound()`, which never return in Next.js either. */
export class NavigationSignal extends Error {
  constructor(
    public kind: "redirect" | "notFound",
    public url?: string,
  ) {
    super(kind === "redirect" ? `NEXT_REDIRECT ${url}` : "NEXT_NOT_FOUND");
  }
}

export const redirect = vi.fn((url: string): never => {
  throw new NavigationSignal("redirect", url);
});

export const notFound = vi.fn((): never => {
  throw new NavigationSignal("notFound");
});

export function setPathname(pathname: string, locale = pathname.split("/")[1] || "en") {
  navigationState.pathname = pathname;
  navigationState.locale = locale;
}

export function resetNextNavigation() {
  navigationState.pathname = "/en";
  navigationState.search = "";
  navigationState.locale = "en";
  for (const fn of Object.values(nextRouter)) fn.mockReset();
  redirect.mockClear();
  notFound.mockClear();
}
