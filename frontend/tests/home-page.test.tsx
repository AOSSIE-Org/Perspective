// Landing page: the article URL form, query prefill, the analysis request and the preset topics on the globe.
import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import HomePage from "@/app/[locale]/page";
import { apiUrl, API_TIMEOUT_MS } from "@/config/api";
import { AOSSIE_URL } from "@/config/links";
import { renderWithIntl, catalogs } from "./helpers/intl";
import { nextRouter } from "./helpers/next-navigation";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
// The globe needs WebGL; it has its own tests in visuals.test.tsx
vi.mock("cobe", () => ({ default: vi.fn(() => ({ destroy: vi.fn() })) }));

const post = vi.mocked(axios.post);
const hero = catalogs.en.Hero;

function inputs(locale: "en" | "hi" = "en") {
  // The desktop and the mobile layout each have their own input; CSS shows one of them
  return screen.getAllByPlaceholderText(catalogs[locale].Hero.inputPlaceholder) as HTMLInputElement[];
}

function submit() {
  fireEvent.submit(document.querySelector("form")!);
}

async function advance(ms: number) {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function setSearch(search: string) {
  window.history.replaceState({}, "", `/en${search}`);
}

// Load the globe chunk with real timers: Vitest's module loader stalls under fake timers, which would leave
// the page's lazy globe pending for the rest of the file
beforeAll(async () => {
  await import("@/components/globe");
});

beforeEach(() => {
  vi.useFakeTimers();
  post.mockReset();
  setSearch("");
  window.innerWidth = 1024;
});

afterEach(() => {
  setSearch("");
});

describe("landing page content", () => {
  it.each(["en", "hi"] as const)("shows the %s hero, credit link and legal notice links", async (locale) => {
    renderWithIntl(<HomePage />, { locale });
    const copy = catalogs[locale].Hero;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(copy.headline);
    expect(screen.getByText(copy.subheading)).toBeInTheDocument();
    const credit = screen.getByRole("link", { name: new RegExp(copy.broughtToYouBy) });
    expect(credit).toHaveAttribute("href", AOSSIE_URL);
    expect(credit).toHaveAttribute("rel", "noopener noreferrer");
    const hrefs = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual(expect.arrayContaining([`/${locale}/terms`, `/${locale}/privacy`]));
    expect(inputs(locale)).toHaveLength(2);
  });

  it("renders the globe once its chunk has loaded", async () => {
    vi.useRealTimers();
    const { container } = renderWithIntl(<HomePage />);
    await waitFor(() => expect(container.querySelector("canvas")).not.toBeNull());
  });
});

describe("URL validation", () => {
  it("asks for a URL when the field is empty and removes the highlight after 2s", async () => {
    renderWithIntl(<HomePage />);
    submit();
    expect(screen.getByText(hero.noUrlError)).toBeInTheDocument();
    const box = inputs()[0].parentElement!;
    expect(box.className).toContain("ring-4");
    await advance(2000);
    expect(box.className).not.toContain("ring-4");
    expect(post).not.toHaveBeenCalled();
  });

  it.each(["not a url", "ftp://example.com/file", "javascript:alert(1)"])("rejects %s without calling the backend", (value) => {
    renderWithIntl(<HomePage />);
    fireEvent.change(inputs()[0], { target: { value } });
    submit();
    expect(screen.getByText(hero.invalidUrlError)).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    expect(sessionStorage.getItem("articleUrl")).toBeNull();
  });

  it("clears the error as soon as the reader edits either input", () => {
    renderWithIntl(<HomePage />);
    submit();
    expect(screen.getByText(hero.noUrlError)).toBeInTheDocument();
    fireEvent.change(inputs()[1], { target: { value: "h" } });
    expect(screen.queryByText(hero.noUrlError)).toBeNull();
    // Both inputs share one value
    expect(inputs()[0].value).toBe("h");
    submit();
    fireEvent.change(inputs()[0], { target: { value: "ht" } });
    expect(screen.queryByText(hero.invalidUrlError)).toBeNull();
  });
});

describe("analysis request", () => {
  const article = "https://example.com/news/story";

  it("posts the trimmed URL to both endpoints, stores the results and opens the report", async () => {
    sessionStorage.setItem("selectedTopicTitle", "old topic");
    post.mockImplementation(async (url: string) =>
      url.endsWith("/bias") ? { data: { bias_score: 72 } } : { data: { perspective: "other side" } },
    );
    renderWithIntl(<HomePage />);
    fireEvent.change(inputs()[0], { target: { value: `  ${article}  ` } });
    submit();

    expect(post).toHaveBeenCalledWith(apiUrl("process"), { url: article }, { timeout: API_TIMEOUT_MS.analysis });
    expect(post).toHaveBeenCalledWith(apiUrl("bias"), { url: article }, { timeout: API_TIMEOUT_MS.analysis });
    expect(sessionStorage.getItem("articleUrl")).toBe(article);
    expect(sessionStorage.getItem("selectedTopicTitle")).toBeNull();
    for (const input of inputs()) expect(input).toBeDisabled();

    // The button walks through the analysis steps while the request runs
    expect(screen.getAllByText(hero.fetchingArticle)).toHaveLength(2);
    await advance(550);
    expect(screen.getAllByText(hero.analysing)).toHaveLength(2);
    expect(JSON.parse(sessionStorage.getItem("BiasScore")!)).toEqual({ bias_score: 72 });
    expect(JSON.parse(sessionStorage.getItem("analysisResult")!)).toEqual({ perspective: "other side" });
    expect(nextRouter.push).not.toHaveBeenCalled();

    // Navigation waits for the last step, then a short pause
    await advance(550 * 4 + 200);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
  });

  it("navigates right away when the backend answers after the animation has finished", async () => {
    const pending: Array<(value: unknown) => void> = [];
    post.mockImplementation(() => new Promise((r) => pending.push(r)) as never);
    renderWithIntl(<HomePage />, { locale: "hi" });
    fireEvent.change(inputs("hi")[0], { target: { value: article } });
    submit();
    await advance(550 * 6);
    expect(nextRouter.push).not.toHaveBeenCalled();
    expect(pending).toHaveLength(2);
    await act(async () => pending.forEach((resolve) => resolve({ data: {} })));
    await advance(250);
    expect(nextRouter.push).toHaveBeenCalledWith("/hi/analyze/results");
  });

  it("ignores a second submit while the first is running", () => {
    post.mockImplementation(() => new Promise(() => {}) as never);
    renderWithIntl(<HomePage />);
    fireEvent.change(inputs()[0], { target: { value: article } });
    submit();
    submit();
    expect(post).toHaveBeenCalledTimes(2);
  });

  it("shows the failure, re-enables the form and stays on the page when the backend fails", async () => {
    post.mockRejectedValue(new Error("Network Error"));
    renderWithIntl(<HomePage />);
    fireEvent.change(inputs()[0], { target: { value: article } });
    submit();
    await advance(0);
    expect(screen.getByText(`${hero.invalidUrlError} (Network Error)`)).toBeInTheDocument();
    for (const input of inputs()) expect(input).toBeEnabled();
    await advance(5000);
    expect(nextRouter.push).not.toHaveBeenCalled();
  });

  it("reports a generic failure for a non-Error rejection", async () => {
    post.mockRejectedValue("timeout");
    renderWithIntl(<HomePage />);
    fireEvent.change(inputs()[0], { target: { value: article } });
    submit();
    await advance(0);
    expect(screen.getByText(`${hero.invalidUrlError} (Analysis failed)`)).toBeInTheDocument();
  });
});

describe("prefill and focus", () => {
  it("prefills the article URL from ?url= and focuses the desktop input", () => {
    setSearch("?url=https%3A%2F%2Fexample.com%2Fa%3Fb%3D1");
    renderWithIntl(<HomePage />);
    expect(inputs()[0].value).toBe("https://example.com/a?b=1");
    expect(document.activeElement).toBe(inputs()[0]);
  });

  it("focuses the mobile input on a narrow screen", () => {
    window.innerWidth = 500;
    setSearch("?url=https%3A%2F%2Fexample.com");
    renderWithIntl(<HomePage />);
    expect(document.activeElement).toBe(inputs()[1]);
  });

  it.each([
    [1024, 0],
    [500, 1],
  ])("?focus=true (width %i) focuses and highlights the input", async (width, index) => {
    window.innerWidth = width;
    setSearch("?focus=true");
    renderWithIntl(<HomePage />);
    expect(document.activeElement).toBe(inputs()[index]);
    expect(inputs()[index].parentElement!.className).toContain("ring-ring/30");
    await advance(2000);
    expect(inputs()[index].parentElement!.className).not.toContain("ring-ring/30");
  });

  it("focuses the input when the navbar's Get Perspective button asks for it", () => {
    renderWithIntl(<HomePage />);
    expect(document.activeElement).not.toBe(inputs()[0]);
    act(() => {
      window.dispatchEvent(new CustomEvent("perspective:prompt-input"));
    });
    expect(document.activeElement).toBe(inputs()[0]);
  });
});

describe("globe placement", () => {
  function sized(element: Element, height: number) {
    Object.defineProperty(element, "clientHeight", { configurable: true, value: height });
  }

  it("shows the top half of the globe but never lets it rise above its section", () => {
    const { container } = renderWithIntl(<HomePage />);
    const section = container.querySelectorAll("section")[1];
    const globe = section.firstElementChild as HTMLElement;
    expect(globe.style.transform).toBe("translateY(50%)");

    sized(section, 400);
    sized(globe, 600);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(globe.style.transform).toBe("translateY(300px)");

    sized(section, 100);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(globe.style.transform).toBe("translateY(500px)");

    // Zero sizes (not laid out yet) leave the last position alone
    sized(section, 0);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });
    expect(globe.style.transform).toBe("translateY(500px)");
  });
});

describe("preset topics", () => {
  it("opens a topic's precomputed report after the step animation, without calling the backend", async () => {
    renderWithIntl(<HomePage />);
    const desktopTopics = screen
      .getAllByRole("button")
      .filter((button) => button.getAttribute("title") && button.closest(".hidden.sm\\:block"));
    expect(desktopTopics).toHaveLength(4);
    fireEvent.click(desktopTopics[0]);

    const url = sessionStorage.getItem("articleUrl")!;
    expect(inputs()[0].value).toBe(url);
    expect(within(inputs()[0].closest("form")!).getAllByText(hero.fetchingArticle)).toHaveLength(2);
    await advance(320 * 5 + 150);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
    expect(post).not.toHaveBeenCalled();
  });
});
