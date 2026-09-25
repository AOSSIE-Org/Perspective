"use client";

import React, { useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Link as LinkIcon, ExternalLink } from "lucide-react";
import axios from "axios";
import { PresetTopics, type PresetTopic } from "@/components/preset-topics";
import { GetPerspectiveButton } from "@/components/get-perspective-button";

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL || "https://thunder1245-perspective-backend.hf.space";

const Globe = dynamic(() => import("@/components/globe").then((m) => m.Globe), {
  ssr: false,
  loading: () => <div className="w-full h-full" />,
});

export default function HomePage() {
  const t = useTranslations("Hero");
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const animationSteps = [
    t("fetchingArticle") || "Fetching Article...",
    t("analysing") || "Analysing...",
    t("detectingBias") || "Detecting Bias...",
    t("checkingFacts") || "Checking Facts...",
    t("generatingPerspectives") || "Generating Perspectives...",
  ];

  // Dynamic globe position: translate the globe down as much as possible while
  // ensuring it never clips above the top of its section on any screen size.
  const globeSectionRef = useRef<HTMLElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const [globeTranslateY, setGlobeTranslateY] = useState("50%");

  useEffect(() => {
    const updateGlobeTranslate = () => {
      const section = globeSectionRef.current;
      const container = globeContainerRef.current;
      if (!section || !container) return;

      const sectionH = section.clientHeight;
      const globeH = container.clientHeight;
      if (sectionH === 0 || globeH === 0) return;

      // Desired visual: push globe down so only the top ~50% is visible (crop bottom half).
      const desiredTranslatePx = globeH * 0.5;
      // Hard constraint: never push so far that the globe's top edge goes above the section.
      const minTranslatePx = Math.max(0, globeH - sectionH);

      const translatePx = Math.max(minTranslatePx, desiredTranslatePx);
      setGlobeTranslateY(`${translatePx}px`);
    };

    updateGlobeTranslate();
    const ro = new ResizeObserver(updateGlobeTranslate);
    if (globeSectionRef.current) ro.observe(globeSectionRef.current);
    if (globeContainerRef.current) ro.observe(globeContainerRef.current);
    window.addEventListener("resize", updateGlobeTranslate);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateGlobeTranslate);
    };
  }, []);

  useEffect(() => {
    const focusAndPrompt = () => {
      if (window.innerWidth >= 768) {
        inputRef.current?.focus();
      } else {
        mobileInputRef.current?.focus();
      }
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
    };

    // Check query parameters on mount
    const params = new URLSearchParams(window.location.search);
    const queryUrl = params.get("url");
    const shouldFocus = params.get("focus");

    if (queryUrl) {
      setUrl(decodeURIComponent(queryUrl));
      if (window.innerWidth >= 768) {
        inputRef.current?.focus();
      } else {
        mobileInputRef.current?.focus();
      }
    } else if (shouldFocus) {
      focusAndPrompt();
    }

    const handlePromptEvent = () => {
      focusAndPrompt();
    };

    window.addEventListener("perspective:prompt-input", handlePromptEvent);
    return () => window.removeEventListener("perspective:prompt-input", handlePromptEvent);
  }, [t]);

  // Handles globe topic clicks with a brisk, fluid animation on the button
  const handleSelectPresetTopic = (topic: PresetTopic) => {
    setUrl(topic.url);
    setErrorMsg("");
    setIsAnalyzing(true);
    setCurrentStepIndex(0);

    const stepDuration = 320;
    let step = 0;
    const interval = setInterval(() => {
      step += 1;
      if (step < animationSteps.length) {
        setCurrentStepIndex(step);
      } else {
        clearInterval(interval);
        setTimeout(() => {
          router.push("/analyze/results");
        }, 150);
      }
    }, stepDuration);
  };

  // Handles URL form submit with backend analysis + synchronized step animation
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnalyzing) return;

    if (!url.trim()) {
      setErrorMsg(t("noUrlError"));
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
      return;
    }

    try {
      new URL(url.trim());
    } catch {
      setErrorMsg(t("invalidUrlError"));
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
      return;
    }

    // Only allow http/https protocols
    const parsedUrl = new URL(url.trim());
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      setErrorMsg(t("invalidUrlError"));
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 2000);
      return;
    }

    setErrorMsg("");
    setIsAnalyzing(true);
    setCurrentStepIndex(0);

    const targetUrl = url.trim();
    sessionStorage.setItem("articleUrl", targetUrl);
    sessionStorage.removeItem("selectedTopicTitle");
    sessionStorage.removeItem("BiasScore");
    sessionStorage.removeItem("analysisResult");

    let step = 0;
    let apiDone = false;

    // Step pacing (550ms per step)
    const stepInterval = setInterval(() => {
      step += 1;
      if (step < animationSteps.length) {
        setCurrentStepIndex(step);
      } else {
        if (apiDone) {
          clearInterval(stepInterval);
          setTimeout(() => router.push("/analyze/results"), 200);
        }
      }
    }, 550);

    try {
      const [processRes, biasRes] = await Promise.all([
        axios.post(`${BACKEND_BASE}/api/process`, { url: targetUrl }, { timeout: 90000 }),
        axios.post(`${BACKEND_BASE}/api/bias`, { url: targetUrl }, { timeout: 90000 }),
      ]);

      sessionStorage.setItem("BiasScore", JSON.stringify(biasRes.data));
      sessionStorage.setItem("analysisResult", JSON.stringify(processRes.data));
    } catch (err) {
      clearInterval(stepInterval);
      setIsAnalyzing(false);
      setCurrentStepIndex(0);
      const msg = err instanceof Error ? err.message : "Analysis failed";
      setErrorMsg(`${t("invalidUrlError")} (${msg})`);
      setIsHighlighted(true);
      setTimeout(() => setIsHighlighted(false), 3000);
      return;
    } finally {
      apiDone = true;
      if (step >= animationSteps.length - 1) {
        clearInterval(stepInterval);
        setTimeout(() => router.push("/analyze/results"), 250);
      }
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between overflow-hidden select-none">
      {/* Hero Section: Centered header matching exact position across all pages */}
      <section className="relative flex flex-col items-center text-center w-full max-w-5xl mx-auto px-4 pt-3 sm:pt-6 md:pt-10 lg:pt-12 pb-2 shrink-0 z-10">
        {/* Token Badge (Exact same padding and properties as other pages) */}
        <a
          href="https://aossie.org"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-brand-border bg-card/60 hover:bg-card text-foreground text-xs font-medium tracking-wide transition-all shadow-sm mb-2 sm:mb-4 md:mb-5 group"
        >
          <span>
            {t("broughtToYouBy")} <strong className="font-bold underline">{t("aossie")}</strong>
          </span>
          <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
        </a>

        {/* Main Headline (Exact same properties and position as other pages) */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-aura md:whitespace-nowrap pt-2 sm:pt-6 md:pt-8 mb-1.5 sm:mb-2 md:mb-3">
          {t("headline")}
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm md:text-base text-foreground-muted opacity-80 max-w-3xl mx-auto mb-2.5 sm:mb-3 md:mb-4 leading-relaxed">
          {t("subheading")}
        </p>

        {/* Search / URL Input Box */}
        <form onSubmit={handleSubmit} className="w-full max-w-xl md:max-w-4xl mx-auto pt-8">
          {/* Desktop Search Bar (Exact original: Separate Input + Separate Button with Gap) */}
          <div className="hidden md:flex items-center gap-3 w-full">
            <div
              className={`flex-1 flex items-center px-6 py-[18px] rounded-[4px] bg-search-bg border shadow-sm transition-all ${
                isHighlighted
                  ? "border-ring ring-4 ring-ring/30 scale-[1.01]"
                  : "border-search-border focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring"
              }`}
            >
              <LinkIcon className="w-4 h-4 text-search-placeholder mr-3 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                disabled={isAnalyzing}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder={t("inputPlaceholder")}
                className="w-full bg-transparent text-foreground placeholder:text-search-placeholder text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
            <GetPerspectiveButton
              type="submit"
              size="lg"
              className="shrink-0"
              isLoading={isAnalyzing}
              loadingStepText={animationSteps[currentStepIndex]}
            />
          </div>

          {/* Mobile Search Bar (Stacked input + button with original roundedness: rounded-[4px]) */}
          <div className="flex md:hidden flex-col items-center gap-2.5 w-full">
            <div
              className={`flex items-center w-full px-4 py-2.5 sm:py-3 rounded-[4px] bg-search-bg border shadow-sm transition-all ${
                isHighlighted
                  ? "border-ring ring-2 ring-ring/30"
                  : "border-search-border focus-within:ring-2 focus-within:ring-ring/20 focus-within:border-ring"
              }`}
            >
              <LinkIcon className="w-4 h-4 text-search-placeholder mr-2.5 shrink-0" />
              <input
                ref={mobileInputRef}
                type="text"
                disabled={isAnalyzing}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (errorMsg) setErrorMsg("");
                }}
                placeholder={t("inputPlaceholder")}
                className="w-full bg-transparent text-foreground placeholder:text-search-placeholder text-xs sm:text-sm focus:outline-none disabled:opacity-60"
              />
            </div>
            <GetPerspectiveButton
              type="submit"
              size="default"
              className="w-full py-2.5 sm:py-3 text-xs sm:text-sm font-semibold rounded-[4px]"
              isLoading={isAnalyzing}
              loadingStepText={animationSteps[currentStepIndex]}
            />
          </div>

          {errorMsg && (
            <p className="mt-2 text-xs text-destructive font-medium text-center animate-fade-in">
              {errorMsg}
            </p>
          )}

          <p className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs text-foreground-muted opacity-75 text-center font-medium tracking-wide">
            {t("noSignInRequired")}
          </p>
        </form>
      </section>

      {/* Globe & Preset Topics Area — overflow-hidden crops the bottom half of the globe */}
      <section
        ref={globeSectionRef as React.RefObject<HTMLElement>}
        className="relative w-full flex-1 min-h-0 flex items-end justify-center pointer-events-none overflow-hidden"
      >
        {/* Centered Globe Container with Overlaid Perspective Tags */}
        <div
          ref={globeContainerRef}
          className="relative mx-auto w-[420px] h-[420px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] xl:w-[760px] xl:h-[760px] pointer-events-auto"
          style={{ transform: `translateY(${globeTranslateY})` }}
        >
          {/* Overlaid Preset Topics with hovering nodes always directly over the globe */}
          <PresetTopics onSelectTopic={handleSelectPresetTopic} />

          {/* 3D COBE Globe Visualizer */}
          <Globe />
        </div>
      </section>
    </div>
  );
}
