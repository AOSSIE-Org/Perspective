"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

const Bucket = dynamic(() => import("@/components/ui/bucket"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[280px]" />,
});

export default function AboutPage() {
  const t = useTranslations("About");

  return (
    <div className="relative w-full h-full max-w-5xl mx-auto px-4 pt-3 sm:pt-6 md:pt-10 lg:pt-12 pb-3 sm:pb-4 flex flex-col justify-between overflow-y-auto md:overflow-hidden select-none">
      {/* Header */}
      <div className="text-center shrink-0">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-brand-border bg-card/60 text-foreground text-xs font-medium tracking-wide transition-all shadow-sm mb-2 sm:mb-4 md:mb-5">
          <span>{t("badge")}</span>
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-aura md:whitespace-nowrap pt-2 sm:pt-6 md:pt-8 mb-1.5 sm:mb-2 md:mb-3">
          {t("title")}
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-foreground-muted opacity-80 max-w-3xl mx-auto mb-2.5 sm:mb-3 md:mb-4 leading-relaxed">
          {t("subtitle")}
        </p>
      </div>

      {/* Interactive 3D Glass Box Stage with Falling Feature Chips */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden my-auto py-1 sm:py-2">
        <Bucket />
      </div>

      {/* Aesthetic Centered Footer */}
      <div className="shrink-0 text-center py-1 sm:py-2 select-none">
        <p className="text-[10px] sm:text-[11px] md:text-xs text-foreground-muted/75 tracking-wide font-normal">
          {t("footer")}
        </p>
      </div>
    </div>
  );
}
