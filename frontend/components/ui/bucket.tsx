"use client";

import { AnimatePresence, motion } from "motion/react";
import React, { useEffect, useState, useMemo } from "react";
import { Brain, ShieldCheck, CheckCircle2, Database } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTranslations } from "next-intl";
import clsx from "clsx";

export interface FeatureChip {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  borderColor: string;
}

interface BucketProps {
  chips?: FeatureChip[];
  className?: string;
}

export default function Bucket({ chips: customChips, className }: BucketProps) {
  const t = useTranslations("About");
  const isMobile = useIsMobile();

  const defaultChips: FeatureChip[] = useMemo(
    () => [
      {
        id: "ai-analysis",
        title: t("feature1Title"),
        description: t("feature1Desc"),
        icon: Brain,
        iconBg: "bg-sky-500/15 dark:bg-sky-400/20",
        iconColor: "text-sky-600 dark:text-sky-400",
        borderColor: "border-sky-500/30",
      },
      {
        id: "bias-detection",
        title: t("feature2Title"),
        description: t("feature2Desc"),
        icon: ShieldCheck,
        iconBg: "bg-amber-500/15 dark:bg-amber-400/20",
        iconColor: "text-amber-600 dark:text-amber-400",
        borderColor: "border-amber-500/30",
      },
      {
        id: "fact-verification",
        title: t("feature3Title"),
        description: t("feature3Desc"),
        icon: CheckCircle2,
        iconBg: "bg-emerald-500/15 dark:bg-emerald-400/20",
        iconColor: "text-emerald-600 dark:text-emerald-400",
        borderColor: "border-emerald-500/30",
      },
      {
        id: "vector-database",
        title: t("feature4Title"),
        description: t("feature4Desc"),
        icon: Database,
        iconBg: "bg-purple-500/15 dark:bg-purple-400/20",
        iconColor: "text-purple-600 dark:text-purple-400",
        borderColor: "border-purple-500/30",
      },
    ],
    [t]
  );

  const activeChips = customChips || defaultChips;
  const [items, setItems] = useState<FeatureChip[]>(activeChips);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    setItems(activeChips);
  }, [activeChips]);

  // Rotate items into the box periodically
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setItems((prev) => {
        if (prev.length <= 1) return prev;
        const [first, ...rest] = prev;
        return [...rest, first];
      });
    }, 2800);

    return () => clearInterval(interval);
  }, [isPaused]);


  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center relative w-full select-none",
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 3D Isometric Frosted Glass Box Container */}
      <div
        className="relative isolate w-full max-w-[460px] sm:max-w-[520px] md:max-w-[560px] max-h-[38vh]"
        style={{ aspectRatio: "655/352" }}
      >
        {/* Layer 0: Background & Interior Box SVG */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 655 352"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 z-0 pointer-events-none"
        >
          {/* Back Right Flap */}
          <g
            filter="url(#filter1_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            <path
              d="M535.59 78.7427L487.973 42.8776L558.738 13.9516C562.902 12.2494 564.984 11.3984 567.143 11.5597C569.301 11.7211 571.233 12.8723 575.098 15.1747L590.22 24.1832C603.923 32.347 610.775 36.4289 610.372 42.0779C609.97 47.7269 602.609 50.7964 587.887 56.9354L535.59 78.7427Z"
              className="fill-white/85 dark:fill-white/[0.42] stroke-black/35 dark:stroke-white/25"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>

          {/* Back Left Flap */}
          <g
            filter="url(#filter2_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            <path
              d="M123.116 79.1145L171.548 42.8776L97.2715 12.5164C94.8305 11.5186 93.61 11.0197 92.3446 11.1143C91.0793 11.2089 89.9465 11.8837 87.681 13.2334L56.155 32.0149C48.1832 36.7641 44.1973 39.1386 44.4205 42.4378C44.6438 45.737 48.9132 47.553 57.4522 51.1849L123.116 79.1145Z"
              className="fill-white/85 dark:fill-white/[0.42] stroke-black/35 dark:stroke-white/25"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>

          {/* Inside Interior Floor (Light Mode Warm Shadow & Dark Mode Glass Radiance) */}
          <g
            filter="url(#filter3_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            {/* Light mode shaded interior floor with subtle black stroke definition */}
            <path
              d="M487.973 42.8774L171.548 42.8775L123.116 79.1144L535.59 78.7424L487.973 42.8774Z"
              fill="url(#paint0_linear_light)"
              fillOpacity="0.9"
              className="dark:hidden stroke-black/30"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
            {/* Dark mode radiant interior floor */}
            <path
              d="M487.973 42.8774L171.548 42.8775L123.116 79.1144L535.59 78.7424L487.973 42.8774Z"
              fill="url(#paint0_linear_dark)"
              fillOpacity="0.72"
              className="hidden dark:block stroke-white/20"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>

          {/* Side Triangular Flap Left */}
          <g
            filter="url(#filter4_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            <path
              d="M171.548 78.9088V42.8774L123.116 79.1144L171.548 78.9088Z"
              className="fill-white/70 dark:fill-white/[0.32] stroke-black/30 dark:stroke-white/20"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>

          {/* Side Triangular Flap Right */}
          <g
            filter="url(#filter5_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            <path
              d="M487.973 78.9088V42.8774L536.404 79.1144L487.973 78.9088Z"
              className="fill-white/70 dark:fill-white/[0.32] stroke-black/30 dark:stroke-white/20"
              strokeWidth="1.5"
              shapeRendering="crispEdges"
            />
          </g>

          <defs>
            {/* Hardware-accelerated lightweight drop shadow filters */}
            <filter id="filter0_i_51_65" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.08" />
            </filter>
            <filter id="filter1_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
            </filter>
            <filter id="filter2_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
            </filter>
            <filter id="filter3_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodOpacity="0.08" />
            </filter>
            <filter id="filter4_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.06" />
            </filter>
            <filter id="filter5_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.06" />
            </filter>
            <filter id="filter6_dddi_51_65" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.1" />
            </filter>

            <clipPath id="center_box_clip">
              <rect x="123.766" y="0" width="413" height="352" />
            </clipPath>

            {/* Dark Mode Glowing Interior Gradient */}
            <linearGradient
              id="paint0_linear_dark"
              x1="329.353"
              y1="42.8774"
              x2="329.353"
              y2="79.1144"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="white" stopOpacity="0.4" />
              <stop offset="1" stopColor="white" stopOpacity="0.2" />
            </linearGradient>

            {/* Light Mode Shaded Interior Depth Gradient (Warm subtle shadow) */}
            <linearGradient
              id="paint0_linear_light"
              x1="329.353"
              y1="42.8774"
              x2="329.353"
              y2="79.1144"
              gradientUnits="userSpaceOnUse"
            >
              <stop stopColor="#e5dbc4" stopOpacity="0.8" />
              <stop offset="1" stopColor="#c8bca0" stopOpacity="0.95" />
            </linearGradient>
          </defs>
        </svg>

        {/* Layer 1: Chip Dropping Animation Container */}
        <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
          <div
            className="relative w-full h-full flex justify-center items-center"
            style={{ paddingBottom: "65%" }}
          >
            <AnimatePresence mode="popLayout">
              {items.map((chip, index) => {
                if (index !== 0) return null;
                const Icon = chip.icon;

                return (
                  <motion.div
                    key={chip.id}
                    initial={{
                      y: isMobile ? -55 : -80,
                      opacity: 0,
                      scale: 0.85,
                    }}
                    animate={{
                      y: 0,
                      opacity: 1,
                      scale: isMobile ? 0.95 : 1.1,
                    }}
                    exit={{
                      y: isMobile ? 85 : 125,
                      opacity: 0,
                      scale: 0.8,
                      transition: {
                        duration: 0.65,
                        ease: [0.4, 0, 0.2, 1],
                      },
                    }}
                    transition={{
                      duration: 0.55,
                      ease: [0.16, 1, 0.3, 1],
                    }}
                    className={clsx(
                      "z-10 rounded-full p-2 sm:p-2.5 w-[260px] sm:w-[290px] shadow-xl absolute pointer-events-auto flex items-center gap-2.5 sm:gap-3 origin-bottom border transition-colors cursor-pointer",
                      "bg-card/95 border-black/20 dark:border-white/20 text-foreground backdrop-blur-md",
                      "dark:bg-card/90 dark:border-white/20 dark:shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
                    )}
                    onClick={() => {
                      setItems((prev) => {
                        const [first, ...rest] = prev;
                        return [...rest, first];
                      });
                    }}
                    title={t("clickToAdvance")}
                  >
                    <div
                      className={clsx(
                        "flex size-9 sm:size-10 shrink-0 items-center justify-center rounded-full border shadow-sm transition-all",
                        chip.iconBg,
                        chip.iconColor,
                        chip.borderColor
                      )}
                    >
                      <Icon className="size-4 sm:size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 min-w-0 pr-1 text-left">
                      <span className="text-xs sm:text-sm font-semibold text-foreground leading-tight truncate">
                        {chip.title}
                      </span>
                      <span className="text-[10px] sm:text-xs text-foreground-muted leading-tight line-clamp-2">
                        {chip.description}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Layer 2: Front Wall of Box & Hanging Frosted Front Flap */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 655 352"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="absolute inset-0 z-20 pointer-events-none overflow-hidden"
          style={{
            transform: "translate3d(0, 0, 0)",
          }}
        >
          {/* Box Front Face (Adapts to light & dark mode semantic card tokens with crisp subtle black outline) */}
          <g filter="url(#filter0_i_51_65)">
            <path
              d="M512.766 79.1595L147.766 79.1624C136.453 79.1625 130.796 79.1626 127.281 82.6773C123.766 86.192 123.766 91.8488 123.766 103.162V327.159C123.766 338.473 123.766 344.13 127.281 347.645C130.796 351.159 136.453 351.159 147.766 351.159H512.766C524.08 351.159 529.737 351.159 533.252 347.645C536.766 344.13 536.766 338.473 536.766 327.159V103.159C536.766 91.8457 536.766 86.1888 533.252 82.6741C529.737 79.1594 524.08 79.1594 512.766 79.1595Z"
              className="fill-card stroke-black/35 dark:stroke-white/30"
              strokeWidth="1.75"
              shapeRendering="crispEdges"
            />
          </g>

          {/* Front Hanging Flap */}
          <g
            filter="url(#filter6_dddi_51_65)"
            data-figma-bg-blur-radius="22.0545"
          >
            <path
              d="M74.6011 164.033L123.116 79.1138L535.59 78.7419L581.532 164.469C588.006 176.55 591.243 182.59 588.568 187.06C585.892 191.529 579.039 191.529 565.333 191.529H90.5591C76.4759 191.529 69.4343 191.529 66.7781 186.953C64.1219 182.376 67.615 176.262 74.6011 164.033Z"
              className="fill-white/85 dark:fill-white/[0.42] stroke-black/35 dark:stroke-white/30"
              strokeWidth="1.75"
              shapeRendering="crispEdges"
            />
          </g>
        </svg>
      </div>

    </div>
  );
}
