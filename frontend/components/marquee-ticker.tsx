"use client";

import { useTranslations } from "next-intl";

export function MarqueeTicker() {
  const t = useTranslations("Ticker");

  const items = [
    t("biasDetection"),
    t("aiAnalysis"),
    t("factVerification"),
    t("challengesPerspective"),
    t("improvesReasoning"),
    t("alternativePerspectives"),
    t("challengesBeliefs"),
  ];

  return (
    <div className="w-full border-t border-border/70 bg-[var(--ticker-bg)] text-[var(--ticker-text)] py-2.5 overflow-hidden select-none z-30">
      <div className="animate-marquee whitespace-nowrap flex items-center">
        {/* Double the list for infinite seamless marquee loop */}
        {[...items, ...items, ...items, ...items].map((item, index) => (
          <span key={index} className="inline-flex items-center mx-4 text-xs md:text-sm font-semibold tracking-wider uppercase">
            <span className="text-[var(--ticker-star)] mr-3 text-base leading-none">✦</span>
            <span>{item}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export default MarqueeTicker;
