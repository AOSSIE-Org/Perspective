// Interactive visuals: the globe, the preset topics over it, the About bucket, the Contribute orbit, and their pages.
import { act, fireEvent, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import createGlobe from "cobe";
import { Globe } from "@/components/globe";
import { PresetTopics } from "@/components/preset-topics";
import Bucket, { type FeatureChip } from "@/components/bucket";
import OrbitingTechStack from "@/components/orbiting-tech-stack";
import AboutPage from "@/app/[locale]/about/page";
import ContributePage from "@/app/[locale]/contribute/page";
import { useIsMobile } from "@/hooks/use-mobile";
import { PRESET_TOPICS } from "@/config/preset-topics";
import { REPO_URL, SOCIAL_LINKS } from "@/config/links";
import { renderWithIntl, catalogs } from "./helpers/intl";
import { nextRouter } from "./helpers/next-navigation";

// cobe draws with WebGL, which jsdom lacks; the fake records the options the globe is created with
vi.mock("cobe", () => ({ default: vi.fn(() => ({ destroy: vi.fn() })) }));
const mockedCreateGlobe = vi.mocked(createGlobe);

type GlobeOptions = Parameters<typeof createGlobe>[1];
const lastGlobeOptions = () => mockedCreateGlobe.mock.calls.at(-1)![1] as GlobeOptions;
const lastGlobe = () => mockedCreateGlobe.mock.results.at(-1)!.value as { destroy: ReturnType<typeof vi.fn> };

afterEach(() => {
  mockedCreateGlobe.mockClear();
  document.documentElement.className = "";
  localStorage.clear();
  window.innerWidth = 1024;
});

describe("Globe", () => {
  it("creates a dark-theme globe sized for the canvas and spins it", () => {
    const { container } = renderWithIntl(<Globe className="extra" />);
    const canvas = container.querySelector("canvas")!;
    expect(mockedCreateGlobe).toHaveBeenCalledTimes(1);
    expect(mockedCreateGlobe.mock.calls[0][0]).toBe(canvas);
    const options = lastGlobeOptions();
    expect(options.dark).toBe(0);
    expect(options.baseColor).toEqual([1, 1, 1]);
    expect(options.width).toBe(600);
    expect(options.markers.length).toBeGreaterThan(0);
    expect(canvas.style.opacity).toBe("1");
    expect(canvas.parentElement).toHaveClass("extra");

    const state: Record<string, number> = {};
    options.onRender(state);
    options.onRender(state);
    expect(state.phi).toBeCloseTo(0.006);
  });

  it("switches to the light palette with the theme and tears down the old globe", async () => {
    localStorage.setItem("theme", "light");
    const { unmount } = renderWithIntl(<Globe />);
    await waitFor(() => expect(lastGlobeOptions().dark).toBe(1));
    expect(lastGlobeOptions().baseColor).toEqual([0.15, 0.22, 0.35]);
    const globe = lastGlobe();
    unmount();
    expect(globe.destroy).toHaveBeenCalledTimes(1);
  });

  it("uses a custom configuration when given one", () => {
    const config = { ...({} as GlobeOptions), width: 10, height: 10, dark: 0.5, markers: [], onRender: () => {} };
    renderWithIntl(<Globe config={config} />);
    expect(lastGlobeOptions().dark).toBe(0.5);
    expect(lastGlobeOptions().markers).toEqual([]);
  });

  it("pauses spinning while the tab is hidden and while the reader drags", () => {
    const { container } = renderWithIntl(<Globe />);
    const canvas = container.querySelector("canvas")!;
    const { onRender } = lastGlobeOptions();
    const state: Record<string, number> = {};

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    document.dispatchEvent(new Event("visibilitychange"));
    onRender(state);
    expect(state.phi).toBeUndefined();
    Object.defineProperty(document, "hidden", { configurable: true, value: false });
    document.dispatchEvent(new Event("visibilitychange"));

    fireEvent.pointerDown(canvas, { clientX: 100 });
    expect(canvas.style.cursor).toBe("grabbing");
    onRender(state);
    const whileDragging = state.phi;
    onRender(state);
    expect(state.phi).toBe(whileDragging);
    fireEvent.pointerMove(window, { clientX: 140 });
    fireEvent.pointerUp(window);
    expect(canvas.style.cursor).toBe("grab");
    onRender(state);
    expect(state.phi).toBeGreaterThan(whileDragging);
  });

  it("logs instead of crashing when WebGL is unavailable, and survives a failing teardown", () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mockedCreateGlobe.mockImplementationOnce(() => {
      throw new Error("no webgl");
    });
    const { container, unmount } = renderWithIntl(<Globe />);
    expect(log).toHaveBeenCalledWith("Globe init error:", expect.any(Error));
    expect(container.querySelector("canvas")!.style.opacity).toBe("");
    unmount();

    mockedCreateGlobe.mockImplementationOnce(() => ({
      destroy: () => {
        throw new Error("already gone");
      },
    }) as never);
    const second = renderWithIntl(<Globe />);
    fireEvent(window, new Event("resize"));
    expect(() => second.unmount()).not.toThrow();
    log.mockRestore();
  });
});

describe("PresetTopics", () => {
  const desktopButtons = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>(".hidden.sm\\:block button"));
  const mobileDots = (container: HTMLElement) =>
    Array.from(container.querySelectorAll<HTMLButtonElement>(".sm\\:hidden > div > button"));

  it("shows four distinct topics from the sixteen freshest", () => {
    const { container } = renderWithIntl(<PresetTopics />);
    const freshest = [...PRESET_TOPICS]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 16)
      .map((topic) => topic.title);
    const shown = desktopButtons(container).map((button) => button.title);
    expect(shown).toHaveLength(4);
    expect(new Set(shown).size).toBe(4);
    for (const title of shown) expect(freshest).toContain(title);
    expect(screen.getByText(catalogs.en.Hero.clickToView)).toBeInTheDocument();
    expect(screen.getByText(catalogs.en.Hero.tapToView)).toBeInTheDocument();
  });

  it("shows Hindi titles in Hindi", () => {
    const { container } = renderWithIntl(<PresetTopics />, { locale: "hi" });
    const hindiTitles = PRESET_TOPICS.map((topic) => topic.titleHi);
    for (const button of desktopButtons(container)) expect(hindiTitles).toContain(button.title);
  });

  it("stores a topic's precomputed analysis and opens the report", () => {
    const { container } = renderWithIntl(<PresetTopics />);
    const button = desktopButtons(container)[2];
    fireEvent.click(button);
    const topic = PRESET_TOPICS.find((t) => t.title === button.title)!;
    expect(sessionStorage.getItem("articleUrl")).toBe(topic.url);
    expect(sessionStorage.getItem("selectedTopicTitle")).toBe(topic.title);
    expect(JSON.parse(sessionStorage.getItem("BiasScore")!)).toEqual(topic.biasScore);
    expect(JSON.parse(sessionStorage.getItem("analysisResult")!)).toEqual(topic.analysisResult);
    expect(nextRouter.push).toHaveBeenCalledWith("/en/analyze/results");
  });

  it("hands the topic to the page's handler instead of navigating when there is one", () => {
    const onSelectTopic = vi.fn();
    const { container } = renderWithIntl(<PresetTopics onSelectTopic={onSelectTopic} />);
    desktopButtons(container).forEach((button) => fireEvent.click(button));
    expect(onSelectTopic.mock.calls.map(([topic, index]) => [topic.title, index])).toEqual(
      desktopButtons(container).map((button, index) => [button.title, index]),
    );
    expect(nextRouter.push).not.toHaveBeenCalled();
  });

  it("on phones, the first tap on a dot shows the title and the second opens it", async () => {
    const onSelectTopic = vi.fn();
    const { container } = renderWithIntl(<PresetTopics onSelectTopic={onSelectTopic} />);
    const dots = mobileDots(container);
    expect(dots).toHaveLength(4);
    const view = catalogs.en.PresetTopics.viewPerspective;
    expect(screen.queryByText(view)).toBeNull();

    fireEvent.click(dots[0]);
    expect(screen.getByText(view)).toBeInTheDocument();
    expect(within(dots[0].parentElement!).getByText(dots[0].getAttribute("aria-label")!)).toBeInTheDocument();
    expect(onSelectTopic).not.toHaveBeenCalled();
    fireEvent.click(dots[0]);
    expect(onSelectTopic).toHaveBeenCalledWith(expect.objectContaining({ title: dots[0].getAttribute("aria-label") }), 0);

    // Tapping outside closes the popup; "View Perspective" opens the topic
    fireEvent.click(dots[3]);
    expect(dots[3].parentElement!.querySelector(".bottom-full")).not.toBeNull();
    fireEvent.click(container.querySelector(".fixed.inset-0")!);
    expect(screen.queryByText(view)).toBeNull();
    fireEvent.click(dots[1]);
    expect(dots[1].parentElement!.querySelector(".top-full.right-0")).not.toBeNull();
    fireEvent.click(screen.getByText(view));
    expect(onSelectTopic).toHaveBeenLastCalledWith(expect.anything(), 1);
  });

  it("falls back to the English title without a Hindi one, and to the fallback title without either", () => {
    const random = vi.spyOn(Math, "random").mockReturnValue(0.999);
    const originals = PRESET_TOPICS.slice();
    const freshest = [...PRESET_TOPICS].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    // With Math.random() ≈ 1 the shuffle keeps the order, so the four freshest topics are shown
    const [noHindi, noTitle] = freshest;
    const patched = [
      { ...noHindi, titleHi: undefined },
      { ...noTitle, titleHi: undefined, title: "" },
    ];
    PRESET_TOPICS.splice(PRESET_TOPICS.indexOf(noHindi), 1, patched[0]);
    PRESET_TOPICS.splice(PRESET_TOPICS.indexOf(noTitle), 1, patched[1]);
    try {
      const { container } = renderWithIntl(<PresetTopics />, { locale: "hi" });
      const titles = desktopButtons(container).map((button) => button.title);
      expect(titles).toContain(noHindi.title);
      expect(titles).toContain(noTitle.fallbackTitle);
    } finally {
      PRESET_TOPICS.splice(0, PRESET_TOPICS.length, ...originals);
      random.mockRestore();
    }
  });
});

describe("useIsMobile", () => {
  it("follows the 768px breakpoint and updates on media query changes", () => {
    let onChange: (() => void) | undefined;
    const removeEventListener = vi.fn();
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      media: query,
      matches: false,
      addEventListener: (_: string, listener: () => void) => (onChange = listener),
      removeEventListener,
    })) as unknown as typeof window.matchMedia;
    try {
      window.innerWidth = 767;
      const { result, unmount } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
      window.innerWidth = 768;
      act(() => onChange!());
      expect(result.current).toBe(false);
      unmount();
      expect(removeEventListener).toHaveBeenCalledWith("change", onChange);
    } finally {
      window.matchMedia = matchMedia;
    }
  });
});

describe("Bucket (About page features)", () => {
  const about = catalogs.en.About;
  const current = (container: HTMLElement) => container.querySelector("[title]") as HTMLElement;

  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("drops one feature at a time into the box, every 2.8s", () => {
    const { container } = renderWithIntl(<Bucket />);
    expect(current(container)).toHaveTextContent(about.feature1Title);
    expect(current(container)).toHaveAttribute("title", about.clickToAdvance);
    expect(current(container)).toHaveTextContent(about.feature1Desc);
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(screen.getByText(about.feature2Title)).toBeInTheDocument();
  });

  it("advances on click and pauses while hovered", () => {
    const { container } = renderWithIntl(<Bucket className="extra" />, { locale: "hi" });
    const hi = catalogs.hi.About;
    fireEvent.click(current(container));
    expect(screen.getByText(hi.feature2Title)).toBeInTheDocument();
    fireEvent.mouseEnter(container.querySelector(".extra")!);
    act(() => {
      vi.advanceTimersByTime(2800 * 3);
    });
    expect(screen.queryByText(hi.feature3Title)).toBeNull();
    fireEvent.mouseLeave(container.querySelector(".extra")!);
    act(() => {
      vi.advanceTimersByTime(2800);
    });
    expect(screen.getByText(hi.feature3Title)).toBeInTheDocument();
  });

  it("shows custom chips, and a single chip stays put", () => {
    window.innerWidth = 500;
    const Icon = () => <svg data-testid="icon" />;
    const chip: FeatureChip = {
      id: "only",
      title: "Only chip",
      description: "Stays",
      icon: Icon,
      iconBg: "",
      iconColor: "",
      borderColor: "",
    };
    renderWithIntl(<Bucket chips={[chip]} />);
    act(() => {
      vi.advanceTimersByTime(2800 * 2);
    });
    expect(screen.getByText("Only chip")).toBeInTheDocument();
    expect(screen.getByTestId("icon")).toBeInTheDocument();
  });
});

describe("OrbitingTechStack (Contribute page)", () => {
  const tech = catalogs.en.TechStack;
  const legend = () => screen.getByRole("button", { name: /All Tech/ }).parentElement!;
  const skillTile = (name: string) => screen.getByAltText(name).closest("[style*='translate3d']") as HTMLElement;

  it("lists every technology on its ring with a filter legend", () => {
    renderWithIntl(<OrbitingTechStack />);
    const all = screen.getByRole("button", { name: /All Tech/ });
    const images = screen.getAllByRole("img");
    expect(all).toHaveTextContent(`All Tech (${images.length})`);
    expect(all.className).toContain("bg-primary");
    const ringButtons = within(legend()).getAllByRole("button").slice(1);
    expect(ringButtons.map((b) => b.textContent?.replace(/\(\d+\)/, "").trim())).toEqual([
      tech.ringAiShort,
      tech.ringBackendShort,
      tech.ringDatabaseShort,
      tech.ringFrontendShort,
    ]);
    const counts = ringButtons.map((b) => Number(b.textContent?.match(/\((\d+)\)/)?.[1]));
    expect(counts.reduce((a, b) => a + b, 0)).toBe(images.length);
    expect(screen.getByAltText("LangGraph")).toHaveAttribute("src", "/brand/icons/langgraph.svg");
    expect(screen.getByTitle(tech.coreTooltip)).toHaveTextContent(tech.core);
  });

  it("filters by ring from the legend, the ring label and the core, and toggles back", () => {
    renderWithIntl(<OrbitingTechStack />);
    const ai = within(legend()).getByRole("button", { name: new RegExp(`^${tech.ringAiShort}`) });
    fireEvent.click(ai);
    expect(ai.className).toContain("bg-primary");
    expect(skillTile("LangGraph").className).not.toContain("opacity-25");
    expect(skillTile("Next.js 15").className).toContain("opacity-25");
    fireEvent.click(ai);
    expect(skillTile("Next.js 15").className).not.toContain("opacity-25");

    const frontendLabel = screen.getByTitle(tech.filterBy.replace("{name}", tech.ringFrontend));
    fireEvent.click(frontendLabel);
    expect(skillTile("Next.js 15").className).not.toContain("opacity-25");
    expect(skillTile("LangGraph").className).toContain("opacity-25");
    fireEvent.click(screen.getByTitle(tech.coreTooltip));
    expect(skillTile("LangGraph").className).not.toContain("opacity-25");
    fireEvent.click(frontendLabel);
    fireEvent.click(screen.getByRole("button", { name: /All Tech/ }));
    expect(skillTile("LangGraph").className).not.toContain("opacity-25");
  });

  it("shows a tooltip with the technology's role while hovered", async () => {
    renderWithIntl(<OrbitingTechStack />);
    const tile = skillTile("LangGraph");
    expect(screen.queryByText(tech.langgraphRole)).toBeNull();
    await userEvent.hover(tile);
    expect(screen.getByText(tech.langgraphRole)).toBeInTheDocument();
    expect(screen.getByText(tech.langgraphDesc)).toBeInTheDocument();
    await userEvent.unhover(tile);
    expect(screen.queryByText(tech.langgraphRole)).toBeNull();
  });

  it("moves the icons along their orbits until the reader hovers the stage", async () => {
    renderWithIntl(<OrbitingTechStack />);
    const tile = skillTile("LangGraph");
    const start = tile.style.transform;
    await waitFor(() => expect(tile.style.transform).not.toBe(start));

    const stage = tile.parentElement!;
    fireEvent.mouseEnter(stage);
    const paused = tile.style.transform;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(tile.style.transform).toBe(paused);
    fireEvent.mouseLeave(stage);
    await waitFor(() => expect(tile.style.transform).not.toBe(paused));
  });

  it("scales the stage to fit its container", () => {
    const { container } = renderWithIntl(<OrbitingTechStack />);
    const root = container.querySelector<HTMLElement>(".flex-1")!;
    const frame = root.firstElementChild as HTMLElement;
    expect(frame.style.width).toBe("486px");

    const resizeTo = (width: number, height: number) => {
      Object.defineProperty(root, "clientWidth", { configurable: true, value: width });
      Object.defineProperty(root, "clientHeight", { configurable: true, value: height });
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });
    };
    resizeTo(255, 600);
    expect(frame.style.width).toBe("243px");
    resizeTo(100, 600);
    expect(frame.style.width).toBe(`${Math.round(486 * 0.35)}px`);
    resizeTo(2000, 2000);
    expect(frame.style.width).toBe("486px");
    resizeTo(0, 0);
    expect(frame.style.width).toBe("486px");
  });
});

describe("About and Contribute pages", () => {
  it.each(["en", "hi"] as const)("About (%s) shows the mission and loads the feature bucket", async (locale) => {
    renderWithIntl(<AboutPage />, { locale });
    const about = catalogs[locale].About;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(about.title);
    expect(screen.getByText(about.badge)).toBeInTheDocument();
    expect(screen.getByText(about.footer)).toBeInTheDocument();
    expect(await screen.findByText(about.feature1Title)).toBeInTheDocument();
  });

  it.each(["en", "hi"] as const)("Contribute (%s) links the repository and Discord and loads the orbit", async (locale) => {
    renderWithIntl(<ContributePage />, { locale });
    const contribute = catalogs[locale].Contribute;
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(contribute.title);
    const github = screen.getByRole("link", { name: new RegExp(contribute.githubBtn) });
    expect(github).toHaveAttribute("href", REPO_URL);
    expect(github).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: new RegExp(contribute.discordBtn) })).toHaveAttribute("href", SOCIAL_LINKS.discord);
    // In Hindi the legend's "All Tech" label is translated, so look for the localized one
    const allTech = catalogs[locale].TechStack.allTech.replace("({count})", "").trim();
    expect(await screen.findByRole("button", { name: new RegExp(allTech) })).toBeInTheDocument();
  });
});
