// The analyze flow: the loading page (backend calls, step animation) and the results report (tabs, chat).
import { act, fireEvent, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import axios from "axios";
import LoadingPage from "@/app/[locale]/analyze/loading/page";
import ResultsPage from "@/app/[locale]/analyze/results/page";
import { apiUrl, API_TIMEOUT_MS } from "@/config/api";
import { renderWithIntl, catalogs } from "./helpers/intl";
import { nextRouter } from "./helpers/next-navigation";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
const post = vi.mocked(axios.post);

/** Advances fake time in 100ms slices, each inside act(), so React renders between timer ticks as in a browser. */
async function advance(ms: number) {
  for (let elapsed = 0; elapsed < ms || elapsed === 0; elapsed += 100) {
    const slice = Math.min(100, ms - elapsed);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(slice);
    });
    if (ms === 0) break;
  }
}

beforeEach(() => {
  post.mockReset();
});

describe("analyze loading page", () => {
  const loading = catalogs.en.AnalyzeLoading;
  const article = "https://example.com/story";

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("sends readers without an article back to the home page", async () => {
    renderWithIntl(<LoadingPage />, { locale: "hi" });
    await advance(0);
    expect(nextRouter.push).toHaveBeenCalledWith("/hi");
    expect(post).not.toHaveBeenCalled();
    expect(screen.getByText(catalogs.hi.AnalyzeLoading.processingSource)).toBeInTheDocument();
  });

  it("skips the backend when results are already stored (preset topics)", async () => {
    sessionStorage.setItem("articleUrl", article);
    sessionStorage.setItem("analysisResult", "{}");
    renderWithIntl(<LoadingPage />);
    await advance(0);
    expect(screen.getByText(article)).toBeInTheDocument();
    expect(screen.getByText("100% Complete")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
    await advance(1199);
    expect(nextRouter.push).not.toHaveBeenCalled();
    await advance(1);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
  });

  it("analyses the article, walks through the five steps and opens the results", async () => {
    sessionStorage.setItem("articleUrl", article);
    post.mockImplementation(async (url: string) => (url.endsWith("/bias") ? { data: { bias_score: 10 } } : { data: { facts: [] } }));
    const { container } = renderWithIntl(<LoadingPage />);
    await advance(0);

    expect(post).toHaveBeenCalledWith(apiUrl("process"), { url: article }, { timeout: API_TIMEOUT_MS.analysis });
    expect(post).toHaveBeenCalledWith(apiUrl("bias"), { url: article }, { timeout: API_TIMEOUT_MS.analysis });
    expect(JSON.parse(sessionStorage.getItem("BiasScore")!)).toEqual({ bias_score: 10 });
    expect(JSON.parse(sessionStorage.getItem("analysisResult")!)).toEqual({ facts: [] });

    // Progress grows 1% every 60ms while the steps advance every 1.2s
    await advance(600);
    expect(screen.getByText("10% Complete")).toBeInTheDocument();
    const stepCards = () => Array.from(container.querySelectorAll(".space-y-2\\.5 > div"));
    expect(stepCards()).toHaveLength(5);
    expect(stepCards()[0].className).toContain("border-ring");
    await advance(1200);
    expect(screen.getByText("30% Complete")).toBeInTheDocument();
    expect(stepCards()[1].className).toContain("border-ring");

    await advance(1200 * 3);
    expect(screen.getByText("90% Complete")).toBeInTheDocument();
    expect(stepCards()[4].className).toContain("border-ring");
    expect(stepCards()[0].className).toContain("opacity-90");
    expect(nextRouter.push).not.toHaveBeenCalled();
    await advance(1200);
    expect(screen.getByText("100% Complete")).toBeInTheDocument();
    await advance(800);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
  });

  it("stores an error result when the backend fails, so the report can still open", async () => {
    sessionStorage.setItem("articleUrl", article);
    post.mockRejectedValue(new Error("502"));
    renderWithIntl(<LoadingPage />);
    await advance(0);
    expect(JSON.parse(sessionStorage.getItem("analysisResult")!)).toEqual({ error: true });
    expect(JSON.parse(sessionStorage.getItem("BiasScore")!)).toEqual({ bias_score: 0 });
    await advance(1200 * 5 + 800);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
  });

  it("stops everything when the reader leaves mid-request", async () => {
    sessionStorage.setItem("articleUrl", article);
    let finish!: () => void;
    post.mockImplementation(() => new Promise((resolve) => (finish = () => resolve({ data: {} }))) as never);
    const { unmount } = renderWithIntl(<LoadingPage />);
    await advance(0);
    unmount();
    await act(async () => finish());
    await advance(10_000);
    expect(sessionStorage.getItem("analysisResult")).toBeNull();
    expect(nextRouter.push).not.toHaveBeenCalled();
  });

  it("does not navigate after leaving during the step animation", async () => {
    sessionStorage.setItem("articleUrl", article);
    post.mockResolvedValue({ data: {} });
    const { unmount } = renderWithIntl(<LoadingPage />);
    await advance(1200 * 2);
    unmount();
    await advance(10_000);
    expect(nextRouter.push).not.toHaveBeenCalled();
  });

  it("shows the step titles in Hindi", async () => {
    renderWithIntl(<LoadingPage />, { locale: "hi" });
    const steps = catalogs.hi.AnalyzeLoading;
    for (const key of ["step1Title", "step2Title", "step3Title", "step4Title", "step5Title"] as const) {
      expect(screen.getByText(steps[key])).toBeInTheDocument();
    }
    expect(screen.queryByText(loading.step1Title)).toBeNull();
  });
});

describe("analyze results page", () => {
  const results = catalogs.en.AnalyzeResults;

  function store(result: unknown, bias?: unknown, extra: Record<string, string> = {}) {
    sessionStorage.setItem("analysisResult", typeof result === "string" ? result : JSON.stringify(result));
    if (bias !== undefined) sessionStorage.setItem("BiasScore", typeof bias === "string" ? bias : JSON.stringify(bias));
    for (const [key, value] of Object.entries(extra)) sessionStorage.setItem(key, value);
  }

  function biasValue() {
    // The meter's header shows "<score>/100"
    return screen.getByText(/\/100$/).textContent;
  }

  it("sends readers without a result home and shows the loading state", () => {
    renderWithIntl(<ResultsPage />);
    expect(screen.getByText(results.loadingReport)).toBeInTheDocument();
    expect(nextRouter.push).toHaveBeenCalledWith("/en");
  });

  it("keeps the loading state when the stored result is corrupt", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    store("{not json");
    renderWithIntl(<ResultsPage />);
    expect(screen.getByText(results.loadingReport)).toBeInTheDocument();
    expect(log).toHaveBeenCalledWith("Failed to parse analysis result:", expect.any(SyntaxError));
    expect(nextRouter.push).not.toHaveBeenCalled();
    log.mockRestore();
  });

  it("shows the topic, the source link, the perspective and the reliability panel", () => {
    store(
      { perspective: "The other side.", sentiment: "negative", score: 64 },
      { bias_score: 72 },
      { articleUrl: "https://example.com/a", selectedTopicTitle: "Fed rates" },
    );
    renderWithIntl(<ResultsPage />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Fed rates");
    expect(screen.getByRole("link", { name: "https://example.com/a" })).toHaveAttribute("href", "https://example.com/a");
    expect(screen.getByRole("link", { name: results.home })).toHaveAttribute("href", "/en");
    expect(screen.getByText("The other side.")).toBeInTheDocument();
    expect(screen.getByText("negative")).toBeInTheDocument();
    expect(screen.getByText("64% Verified")).toBeInTheDocument();
    expect(biasValue()).toBe("72/100");
    expect(screen.getByText(catalogs.en.BiasMeter.highBias)).toBeInTheDocument();
  });

  it("falls back to defaults for a minimal result", () => {
    store({});
    renderWithIntl(<ResultsPage />, { locale: "hi" });
    const hi = catalogs.hi.AnalyzeResults;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(hi.defaultTitle);
    expect(screen.getByText(hi.defaultPerspective)).toBeInTheDocument();
    expect(screen.getByText("Neutral")).toBeInTheDocument();
    expect(screen.getByText(hi.verified.replace("{score}", "85"))).toBeInTheDocument();
    expect(biasValue()).toBe("45/100");
    expect(screen.queryByRole("link", { name: /^https?:/ })).toBeNull();
  });

  it.each([
    [{ perspective: "from object", reasoning: "why" }, "from object"],
    [{ reasoning: "only reasoning" }, "only reasoning"],
    [{}, results.defaultPerspective],
  ])("reads a structured perspective %j", (perspective, shown) => {
    store({ perspective });
    renderWithIntl(<ResultsPage />);
    expect(screen.getByText(shown)).toBeInTheDocument();
  });

  it.each([
    ["a bare number", "33", "33/100"],
    ["an object without a score", '{"label":"x"}', "45/100"],
    ["corrupt JSON", "{oops", "45/100"],
    ["zero", '{"bias_score":0}', "0/100"],
  ])("reads the bias score from %s", (_, raw, shown) => {
    store({}, raw);
    renderWithIntl(<ResultsPage />);
    expect(biasValue()).toBe(shown);
  });

  it("lists fact checks with verdicts, and switches between tabs", () => {
    store({
      facts: [
        "Plain string claim",
        { claim: "Claim A", verdict: "True", explanation: "Because of A" },
        { original_claim: "Original B", explanation: "Original B" },
        { explanation: "Only an explanation" },
        {},
      ],
    });
    renderWithIntl(<ResultsPage />);
    const factsTab = screen.getByRole("button", { name: "Fact Checks (5)" });
    expect(factsTab.className).not.toContain("bg-primary");
    fireEvent.click(factsTab);
    expect(factsTab.className).toContain("bg-primary");
    expect(screen.queryByText(results.synthesizedTitle)).toBeNull();

    expect(screen.getByText(results.claimsTitle)).toBeInTheDocument();
    expect(screen.getByText("Plain string claim")).toBeInTheDocument();
    expect(screen.getByText("[True]")).toBeInTheDocument();
    expect(screen.getByText("Because of A")).toBeInTheDocument();
    // An explanation equal to the claim is not repeated
    expect(screen.getAllByText("Original B")).toHaveLength(1);
    expect(screen.getAllByText("Only an explanation")).toHaveLength(1);
    expect(screen.getByText("Verified Claim")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: results.tabPerspective }));
    expect(screen.getByText(results.synthesizedTitle)).toBeInTheDocument();
  });

  it("says all claims were verified when there are no fact checks", () => {
    store({ facts: [] });
    renderWithIntl(<ResultsPage />);
    fireEvent.click(screen.getByRole("button", { name: "Fact Checks (0)" }));
    expect(screen.getByText(results.claimsVerified)).toBeInTheDocument();
  });

  describe("chat", () => {
    function openChat() {
      store({});
      renderWithIntl(<ResultsPage />);
      fireEvent.click(screen.getByRole("button", { name: results.tabChat }));
      const input = screen.getByPlaceholderText(results.chatPlaceholder);
      const send = input.closest("form")!.querySelector("button")!;
      return { input, send };
    }

    it("greets the reader and only enables sending for a non-blank message", () => {
      const { input, send } = openChat();
      expect(screen.getByText(results.chatGreeting)).toBeInTheDocument();
      expect(send).toBeDisabled();
      fireEvent.change(input, { target: { value: "   " } });
      expect(send).toBeDisabled();
      fireEvent.submit(input.closest("form")!);
      expect(post).not.toHaveBeenCalled();
      fireEvent.change(input, { target: { value: "Why?" } });
      expect(send).toBeEnabled();
    });

    it("sends the trimmed question and shows the answer", async () => {
      let answer!: (value: unknown) => void;
      post.mockImplementation(() => new Promise((resolve) => (answer = resolve)) as never);
      const { input, send } = openChat();
      fireEvent.change(input, { target: { value: "  Why is it biased?  " } });
      fireEvent.click(send);

      expect(post).toHaveBeenCalledWith(apiUrl("chat"), { message: "Why is it biased?" }, { timeout: API_TIMEOUT_MS.chat });
      expect(screen.getByText("Why is it biased?").className).toContain("bg-primary");
      expect(input).toHaveValue("");
      // While waiting, a second message cannot be sent
      fireEvent.change(input, { target: { value: "again" } });
      expect(send).toBeDisabled();
      fireEvent.submit(input.closest("form")!);
      expect(post).toHaveBeenCalledTimes(1);

      await act(async () => answer({ data: { answer: "Because of framing." } }));
      expect(screen.getByText("Because of framing.").className).toContain("bg-secondary/50");
      expect(send).toBeEnabled();
    });

    it("answers with a fallback when the chat request fails", async () => {
      post.mockRejectedValue(new Error("offline"));
      const { input, send } = openChat();
      fireEvent.change(input, { target: { value: "Hello" } });
      await act(async () => {
        fireEvent.click(send);
      });
      expect(screen.getByText(results.chatFallback)).toBeInTheDocument();
    });
  });
});
