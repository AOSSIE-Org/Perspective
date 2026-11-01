// Property tests (fast-check) on the components' invariants. Each property renders real components, so the
// number of runs is kept small enough for the suite to stay fast.
import { act, cleanup, fireEvent, screen, within } from "@testing-library/react";
import fc from "fast-check";
import { describe, expect, it, vi } from "vitest";
import axios from "axios";
import BiasMeter from "@/components/bias-meter";
import { GetPerspectiveButton } from "@/components/get-perspective-button";
import { Navbar } from "@/components/navbar";
import LanguageSwitcher from "@/components/language-switcher";
import { PresetTopics } from "@/components/preset-topics";
import HomePage from "@/app/[locale]/page";
import ResultsPage from "@/app/[locale]/analyze/results/page";
import { reducer } from "@/hooks/use-toast";
import { PRESET_TOPICS } from "@/config/preset-topics";
import { renderWithIntl, catalogs } from "./helpers/intl";
import { nextRouter, resetNextNavigation } from "./helpers/next-navigation";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("cobe", () => ({ default: vi.fn(() => ({ destroy: vi.fn() })) }));
const post = vi.mocked(axios.post);

/** Runs a property where each example renders: unmount and reset shared state between examples. */
function eachRender<T>(arb: fc.Arbitrary<T>, check: (value: T) => void, numRuns = 30) {
  fc.assert(
    fc.property(arb, (value) => {
      try {
        check(value);
      } finally {
        cleanup();
        resetNextNavigation();
        sessionStorage.clear();
      }
    }),
    { numRuns },
  );
}

const locales = fc.constantFrom("en" as const, "hi" as const);

describe("properties", () => {
  it("BiasMeter: every score in 0-100 gets exactly the label and ring fill of its band", () => {
    const circumference = 2 * Math.PI * 45;
    eachRender(fc.tuple(fc.integer({ min: 0, max: 100 }), locales), ([score, locale]) => {
      const { container } = renderWithIntl(<BiasMeter score={score} />, { locale });
      const labels = catalogs[locale].BiasMeter;
      const expected = score <= 30 ? labels.lowBias : score <= 60 ? labels.moderateBias : labels.highBias;
      const shown = [labels.lowBias, labels.moderateBias, labels.highBias].filter((label) => screen.queryByText(label));
      expect(shown).toEqual([expected]);
      const offset = Number(container.querySelectorAll("circle")[1].getAttribute("stroke-dashoffset"));
      expect(offset).toBeCloseTo(circumference * (1 - score / 100));
    });
  });

  it("GetPerspectiveButton: a link only with an href and not loading; loading is always a disabled button", () => {
    const props = fc.record({
      href: fc.option(fc.constantFrom("/", "/about", "/contribute"), { nil: undefined }),
      isLoading: fc.boolean(),
      disabled: fc.boolean(),
      showLogo: fc.boolean(),
      size: fc.constantFrom("default" as const, "sm" as const, "lg" as const),
      variant: fc.constantFrom("default" as const, "topic" as const),
      loadingStepText: fc.option(fc.string({ minLength: 1, maxLength: 20 }).filter((s) => s.trim() === s && s !== ""), {
        nil: undefined,
      }),
    });
    eachRender(fc.tuple(props, locales), ([p, locale]) => {
      const { container } = renderWithIntl(<GetPerspectiveButton {...p} />, { locale });
      const links = screen.queryAllByRole("link");
      const buttons = screen.queryAllByRole("button");
      expect(links.length + buttons.length).toBe(1);
      if (p.href && !p.isLoading) {
        expect(links[0]).toHaveAttribute("href", p.href === "/" ? `/${locale}` : `/${locale}${p.href}`);
      } else {
        expect(buttons[0].hasAttribute("disabled")).toBe(p.disabled || p.isLoading);
      }
      if (p.isLoading) {
        expect(container.textContent).toContain(p.loadingStepText ?? "Analysing...");
      } else {
        expect(container.querySelector("svg") !== null).toBe(p.showLogo);
        expect(container.textContent).toContain(catalogs[locale].Common.getPerspective);
      }
    });
  });

  it("Navbar: at most one page is marked active, and it is the page the path is under", () => {
    // Pages with a navbar link; the legal pages have none, so nothing is active there
    const pages = ["/", "/contribute", "/about", "/support"];
    const path = fc.oneof(
      fc.constantFrom(...pages, "/privacy", "/terms"),
      fc.tuple(fc.constantFrom("/contribute", "/about", "/privacy", "/terms", "/support", "/analyze"), fc.stringMatching(/^(\/[a-z0-9-]{1,8}){0,2}$/)).map(
        ([base, rest]) => base + rest,
      ),
    );
    eachRender(fc.tuple(path, locales), ([pathname, locale]) => {
      renderWithIntl(<Navbar />, { locale, path: pathname === "/" ? "" : pathname });
      const links = within(screen.getAllByRole("navigation")[0]).getAllByRole("link");
      const active = links.filter((link) => link.className.includes("font-semibold")).map((link) => link.getAttribute("href"));
      const owner = pathname === "/" ? "/" : pages.find((page) => page !== "/" && pathname.startsWith(page));
      expect(active).toEqual(owner ? [owner === "/" ? `/${locale}` : `/${locale}${owner}`] : []);
    }, 40);
  });

  it("LanguageSwitcher: switching language keeps the page and only swaps the locale prefix", () => {
    const page = fc.constantFrom("", "/about", "/contribute", "/privacy", "/terms", "/support", "/analyze/results");
    eachRender(fc.tuple(page, locales, locales), ([path, from, to]) => {
      renderWithIntl(<LanguageSwitcher />, { locale: from, path });
      fireEvent.click(screen.getByRole("button"));
      fireEvent.click(screen.getByRole("button", { name: to === "en" ? /English/ : /Hindi/ }));
      expect(nextRouter.replace).toHaveBeenCalledWith(`/${to}${path}`);
    });
  });

  it("PresetTopics: whatever the shuffle draws, four distinct topics from the sixteen freshest are shown", () => {
    const freshest = new Set(
      [...PRESET_TOPICS]
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, 16)
        .map((topic) => topic.title),
    );
    const draws = fc.array(fc.double({ min: 0, max: 1, maxExcluded: true, noNaN: true }), { minLength: 15, maxLength: 15 });
    eachRender(draws, (sequence) => {
      let call = 0;
      const random = vi.spyOn(Math, "random").mockImplementation(() => sequence[call++ % sequence.length]);
      try {
        const { container } = renderWithIntl(<PresetTopics />);
        const titles = Array.from(container.querySelectorAll<HTMLButtonElement>(".hidden.sm\\:block button")).map((b) => b.title);
        expect(titles).toHaveLength(4);
        expect(new Set(titles).size).toBe(4);
        for (const title of titles) expect(freshest.has(title)).toBe(true);
      } finally {
        random.mockRestore();
      }
    });
  });

  it("Landing form: only http(s) URLs reach the backend, and they are sent trimmed", () => {
    const valid = fc.webUrl({ validSchemes: ["http", "https"] }).map((url) => ({ url, ok: true }));
    const invalid = fc
      .oneof(
        fc.string({ maxLength: 30 }).filter((s) => !/^\s*https?:\/\/\S/i.test(s)),
        fc.webUrl().map((url) => url.replace(/^https?:/, "ftp:")),
        fc.constantFrom("javascript:alert(1)", "data:text/html,hi", "mailto:a@b.c", "file:///etc/passwd"),
      )
      .map((url) => ({ url, ok: false }));
    const padding = fc.constantFrom("", " ", "  \t");
    eachRender(
      fc.tuple(fc.oneof(valid, invalid), padding),
      ([{ url, ok }, pad]) => {
        post.mockReset();
        post.mockImplementation(() => new Promise(() => {}) as never);
        renderWithIntl(<HomePage />);
        const input = screen.getAllByPlaceholderText(catalogs.en.Hero.inputPlaceholder)[0];
        fireEvent.change(input, { target: { value: pad + url + pad } });
        fireEvent.submit(document.querySelector("form")!);
        if (ok) {
          expect(post).toHaveBeenCalledTimes(2);
          expect(post.mock.calls.map((call) => call[1])).toEqual([{ url }, { url }]);
          expect(sessionStorage.getItem("articleUrl")).toBe(url);
        } else {
          expect(post).not.toHaveBeenCalled();
          expect(sessionStorage.getItem("articleUrl")).toBeNull();
        }
      },
      25,
    );
  });

  it("Results page: every fact is listed once, showing its claim, else original claim, else explanation", () => {
    const text = fc.string({ minLength: 1, maxLength: 12 }).filter((s) => s.trim() === s && s !== "").map((s) => `«${s}»`);
    const fact = fc.oneof(
      text,
      fc.record(
        { claim: text, original_claim: text, explanation: text, verdict: fc.constantFrom("True", "False", "Unclear") },
        { requiredKeys: [] },
      ),
    );
    eachRender(
      fc.uniqueArray(fact, { maxLength: 5, selector: (f) => JSON.stringify(f) }),
      (facts) => {
        sessionStorage.setItem("analysisResult", JSON.stringify({ facts }));
        renderWithIntl(<ResultsPage />);
        fireEvent.click(screen.getByRole("button", { name: `Fact Checks (${facts.length})` }));
        const cards = Array.from(document.querySelectorAll(".space-y-2\\.5 > div.p-3"));
        expect(cards).toHaveLength(facts.length);
        facts.forEach((f, i) => {
          const claim = typeof f === "string" ? f : f.claim || f.original_claim || f.explanation || "Verified Claim";
          expect(cards[i].querySelector("p")!.textContent).toBe(claim);
        });
        if (facts.length === 0) expect(screen.getByText(catalogs.en.AnalyzeResults.claimsVerified)).toBeInTheDocument();
      },
      25,
    );
  });

  it("toast store: any sequence of actions keeps at most one toast and never duplicates an id", () => {
    const id = fc.constantFrom("a", "b", "c");
    const action = fc.oneof(
      id.map((toastId) => ({ type: "ADD_TOAST" as const, toast: { id: toastId, open: true } })),
      fc.tuple(id, fc.string({ maxLength: 5 })).map(([toastId, title]) => ({ type: "UPDATE_TOAST" as const, toast: { id: toastId, title } })),
      fc.option(id, { nil: undefined }).map((toastId) => ({ type: "DISMISS_TOAST" as const, toastId })),
      fc.option(id, { nil: undefined }).map((toastId) => ({ type: "REMOVE_TOAST" as const, toastId })),
    );
    vi.useFakeTimers();
    try {
      fc.assert(
        fc.property(fc.array(action, { maxLength: 20 }), (actions) => {
          let state: Parameters<typeof reducer>[0] = { toasts: [] };
          for (const a of actions) {
            const before = state;
            state = reducer(state, a);
            expect(state.toasts.length).toBeLessThanOrEqual(1);
            expect(new Set(state.toasts.map((t) => t.id)).size).toBe(state.toasts.length);
            if (a.type === "REMOVE_TOAST" && a.toastId) expect(state.toasts.some((t) => t.id === a.toastId)).toBe(false);
            if (a.type === "ADD_TOAST") expect(state.toasts[0].id).toBe(a.toast.id);
            if (a.type === "DISMISS_TOAST") {
              expect(state.toasts.map((t) => t.id)).toEqual(before.toasts.map((t) => t.id));
            }
          }
        }),
      );
    } finally {
      act(() => {
        vi.clearAllTimers();
      });
      vi.useRealTimers();
    }
  });
});
