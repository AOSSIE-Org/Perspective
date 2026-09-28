"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations, useLocale } from "next-intl";
import { PRESET_TOPICS, type PresetTopic } from "@/config/preset-topics";
import { ArrowPointer } from "@/components/arrow-pointer";
import { FingerPointer } from "@/components/finger-pointer";

export { type PresetTopic } from "@/config/preset-topics";

export interface PresetTopicsProps {
  onSelectTopic?: (topic: PresetTopic, index?: number) => void;
}

export function PresetTopics({ onSelectTopic }: PresetTopicsProps) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("PresetTopics");
  const tHero = useTranslations("Hero");
  const [activeMobileTopic, setActiveMobileTopic] = useState<number | null>(null);

  // Default to first 4 for consistent SSR, then randomize client-side on every refresh from freshest 16
  const [topics, setTopics] = useState<PresetTopic[]>(() => PRESET_TOPICS.slice(0, 4));

  useEffect(() => {
    // Sort by publication date descending and take the freshest 16 topics
    const freshestPool = [...PRESET_TOPICS]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 16);

    // Fisher-Yates shuffle to pick 4 completely unique random topics on each refresh
    for (let i = freshestPool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [freshestPool[i], freshestPool[j]] = [freshestPool[j], freshestPool[i]];
    }
    setTopics(freshestPool.slice(0, 4));
  }, []);

  const getTopicTitle = (topic: PresetTopic) => {
    if (locale === "hi" && topic.titleHi) {
      return topic.titleHi;
    }
    return topic.title || topic.fallbackTitle;
  };

  const handleTopicClick = (topic: PresetTopic, index?: number) => {
    const title = getTopicTitle(topic);

    sessionStorage.setItem("articleUrl", topic.url);
    sessionStorage.setItem("selectedTopicTitle", title);
    sessionStorage.setItem("BiasScore", JSON.stringify(topic.biasScore));
    sessionStorage.setItem("analysisResult", JSON.stringify(topic.analysisResult));

    if (onSelectTopic) {
      onSelectTopic(topic, index);
    } else {
      router.push("/analyze/results");
    }
  };

  const mobileDotPositions = [
    { top: "16%", left: "27%", index: 0, align: "left" as const, direction: "down" as const },
    { top: "16%", right: "27%", index: 1, align: "right" as const, direction: "down" as const },
    { top: "29%", left: "20%", index: 2, align: "left" as const, direction: "up" as const },
    { top: "29%", right: "20%", index: 3, align: "right" as const, direction: "up" as const },
  ];

  const t1 = topics[0] || PRESET_TOPICS[0];
  const t2 = topics[1] || PRESET_TOPICS[1];
  const t3 = topics[2] || PRESET_TOPICS[2];
  const t4 = topics[3] || PRESET_TOPICS[3];

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Click outside backdrop for mobile popup */}
      {activeMobileTopic !== null && (
        <div
          className="fixed inset-0 z-30 sm:hidden pointer-events-auto"
          onClick={() => setActiveMobileTopic(null)}
        />
      )}

      {/* Pointer Guide Pill: "Click/Tap to View a Perspective" with Arrow (Desktop) or Finger (Mobile) on top of globe */}
      <div className="absolute top-[2%] sm:top-[2.5%] left-1/2 -translate-x-1/2 z-30 pointer-events-none">
        <div className="relative inline-flex items-center">
          {/* DESKTOP (hidden sm:block): Arrow Pointer positioned at top-left of the pill */}
          <div className="hidden sm:block absolute -top-3.5 -left-3.5 z-10 pointer-events-none drop-shadow-sm">
            <ArrowPointer className="w-5 h-5 sm:w-6 sm:h-6 text-guide-pointer" />
          </div>

          {/* MOBILE (sm:hidden): Finger Pointer compliant with light (#BE8800) and dark (#2AABEE) */}
          <div className="sm:hidden absolute -top-3.5 -left-3.5 z-10 pointer-events-none drop-shadow-sm">
            <FingerPointer className="w-6 h-6 object-contain text-guide-pointer" />
          </div>

          {/* Static guide pill */}
          <div className="px-4 py-1.5 rounded-full border border-guide-border bg-guide-bg text-foreground font-semibold text-xs shadow-md whitespace-nowrap">
            <span className="hidden sm:inline">{tHero("clickToView")}</span>
            <span className="sm:hidden">{tHero("tapToView")}</span>
          </div>
        </div>
      </div>

      {/* MOBILE (sm:hidden): Interactive Pulse Nodes on Globe */}
      <div className="sm:hidden">
        {mobileDotPositions.map((pos) => {
          const topic = topics[pos.index] || PRESET_TOPICS[pos.index];
          const isActive = activeMobileTopic === pos.index;
          const title = getTopicTitle(topic);

          return (
            <div
              key={pos.index}
              style={{
                top: pos.top,
                left: pos.left,
                right: pos.right,
              }}
              className="absolute z-40 pointer-events-auto"
            >
              <button
                type="button"
                onClick={() => {
                  if (isActive) {
                    handleTopicClick(topic, pos.index);
                  } else {
                    setActiveMobileTopic(pos.index);
                  }
                }}
                className="relative flex items-center justify-center p-3 rounded-full cursor-pointer group touch-manipulation"
                aria-label={title}
              >
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pulse-ping opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-pulse-dot border-2 border-background shadow-md"></span>
                </span>
              </button>

              {isActive && (
                <div
                  className={`absolute ${
                    pos.align === "left" ? "left-0" : "right-0"
                  } ${
                    pos.direction === "down" ? "top-full mt-2" : "bottom-full mb-2"
                  } z-50 bg-card/95 border border-border p-2.5 rounded-xl shadow-2xl min-w-[160px] max-w-[190px] text-center animate-fade-in pointer-events-auto backdrop-blur-md`}
                >
                  <p className="text-[11px] font-semibold text-foreground mb-1 leading-snug">
                    {title}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleTopicClick(topic, pos.index)}
                    className="text-[10px] font-bold text-primary underline hover:opacity-80 transition-opacity"
                  >
                    {t("viewPerspective")}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* DESKTOP / TABLET (hidden sm:block): Overlaid Tags with 0-rounded corner towards the globe */}
      <div className="hidden sm:block">
        {/* Floating Topic 1: Top-Left (Bottom-Right corner has 0 roundedness towards globe) */}
        <div className="absolute top-[20%] right-[73%] z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleTopicClick(t1, 0)}
            title={getTopicTitle(t1)}
            className="group max-w-[calc(50vw-16px)] md:max-w-none px-4 py-2 md:px-5 md:py-2.5 rounded-full rounded-br-none border border-topic-border bg-topic-bg text-foreground text-xs md:text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap text-left"
          >
            <span className="group-hover:text-primary transition-colors">
              {getTopicTitle(t1)}
            </span>
          </button>
        </div>

        {/* Floating Topic 2: Top-Right (Bottom-Left corner has 0 roundedness towards globe) */}
        <div className="absolute top-[20%] left-[73%] z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleTopicClick(t2, 1)}
            title={getTopicTitle(t2)}
            className="group max-w-[calc(50vw-16px)] md:max-w-none px-4 py-2 md:px-5 md:py-2.5 rounded-full rounded-bl-none border border-topic-border bg-topic-bg text-foreground text-xs md:text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap text-left"
          >
            <span className="group-hover:text-primary transition-colors">
              {getTopicTitle(t2)}
            </span>
          </button>
        </div>

        {/* Floating Topic 3: Lower-Left (Bottom-Right corner has 0 roundedness towards globe) */}
        <div className="absolute top-[36%] right-[81%] z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleTopicClick(t3, 2)}
            title={getTopicTitle(t3)}
            className="group max-w-[calc(50vw-16px)] md:max-w-none px-4 py-2 md:px-5 md:py-2.5 rounded-full rounded-br-none border border-topic-border bg-topic-bg text-foreground text-xs md:text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap text-left"
          >
            <span className="group-hover:text-primary transition-colors">
              {getTopicTitle(t3)}
            </span>
          </button>
        </div>

        {/* Floating Topic 4: Lower-Right (Bottom-Left corner has 0 roundedness towards globe) */}
        <div className="absolute top-[36%] left-[81%] z-30 pointer-events-auto">
          <button
            type="button"
            onClick={() => handleTopicClick(t4, 3)}
            title={getTopicTitle(t4)}
            className="group max-w-[calc(50vw-16px)] md:max-w-none px-4 py-2 md:px-5 md:py-2.5 rounded-full rounded-bl-none border border-topic-border bg-topic-bg text-foreground text-xs md:text-sm font-semibold shadow-md hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer whitespace-nowrap text-left"
          >
            <span className="group-hover:text-primary transition-colors">
              {getTopicTitle(t4)}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default PresetTopics;
