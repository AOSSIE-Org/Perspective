"use client";

import React, { useEffect, useState, useRef, memo, useMemo } from "react";
import Image from "next/image";
import clsx from "clsx";
import { useTranslations } from "next-intl";
import PerspectiveLogo from "@/components/perspective-logo";

// --- Type Definitions ---
export type RingId = "ai" | "backend" | "database" | "frontend";

export interface RingConfig {
  id: RingId;
  name: string;
  shortName: string;
  radius: number;
  speed: number;
}

export interface SkillConfig {
  id: string;
  name: string;
  ringId: RingId;
  orbitRadius: number;
  size: number;
  speed: number;
  phaseShift: number;
  iconSrc: string;
  brandColor: string;
  role: string;
  description: string;
  invertInDark?: boolean;
}

// --- Concentric Ring Tier Definitions ---
export const ringsConfig: RingConfig[] = [
  {
    id: "ai",
    name: "AI & Agents",
    shortName: "AI",
    radius: 70,
    speed: 0.38,
  },
  {
    id: "backend",
    name: "Backend",
    shortName: "Backend",
    radius: 121,
    speed: -0.28,
  },
  {
    id: "database",
    name: "Database",
    shortName: "Database",
    radius: 171,
    speed: 0.2,
  },
  {
    id: "frontend",
    name: "Frontend",
    shortName: "Frontend",
    radius: 221,
    speed: -0.15,
  },
];

// --- Exhaustive Technology Configuration Using Real Assets in brand/icons/ ---
export const skillsConfig: SkillConfig[] = [
  // --- Inner Ring: AI & Agents (r = 70) ---
  {
    id: "langgraph",
    name: "LangGraph",
    ringId: "ai",
    orbitRadius: 70,
    size: 42,
    speed: 0.38,
    phaseShift: 0,
    iconSrc: "/brand/icons/langgraph.svg",
    brandColor: "#F97316",
    role: "Multi-Agent Graphs",
    description: "Stateful agent workflow orchestrator coordinating evaluation nodes.",
  },
  {
    id: "groq",
    name: "Groq LLaMA 3.3",
    ringId: "ai",
    orbitRadius: 70,
    size: 42,
    speed: 0.38,
    phaseShift: Math.PI / 2,
    iconSrc: "/brand/icons/groq.svg",
    brandColor: "#F55036",
    role: "Sub-Second LLM",
    description: "Ultra-low latency inference engine powering counter-perspective generation.",
  },
  {
    id: "langchain",
    name: "LangChain",
    ringId: "ai",
    orbitRadius: 70,
    size: 42,
    speed: 0.38,
    phaseShift: Math.PI,
    iconSrc: "/brand/icons/langchain.svg",
    brandColor: "#10B981",
    role: "Chains & Prompts",
    description: "Connects LLMs with modular prompts, structured parsers, and toolkits.",
  },
  {
    id: "nltk",
    name: "NLP & NLTK",
    ringId: "ai",
    orbitRadius: 70,
    size: 42,
    speed: 0.38,
    phaseShift: (3 * Math.PI) / 2,
    iconSrc: "/brand/icons/nltk.svg",
    brandColor: "#8B5CF6",
    role: "Sentiment & Tone",
    description: "Tokenization, keyword extraction, and linguistic polarity detection.",
  },

  // --- Middle Ring: Backend (r = 121) ---
  {
    id: "fastapi",
    name: "FastAPI",
    ringId: "backend",
    orbitRadius: 121,
    size: 42,
    speed: -0.28,
    phaseShift: Math.PI / 4,
    iconSrc: "/brand/icons/FastAPI.svg",
    brandColor: "#009688",
    role: "High-Speed Async API",
    description: "Python 3.13 REST API framework serving perspective analysis streams.",
  },
  {
    id: "python",
    name: "Python 3.13",
    ringId: "backend",
    orbitRadius: 121,
    size: 42,
    speed: -0.28,
    phaseShift: (3 * Math.PI) / 4,
    iconSrc: "/brand/icons/Python.svg",
    brandColor: "#387EB8",
    role: "Core AI Engine",
    description: "Powers backend computational logic, machine learning pipelines, and agents.",
  },
  {
    id: "uvicorn",
    name: "Uvicorn",
    ringId: "backend",
    orbitRadius: 121,
    size: 42,
    speed: -0.28,
    phaseShift: (5 * Math.PI) / 4,
    iconSrc: "/brand/icons/uvicorn.svg",
    brandColor: "#9333EA",
    role: "Async ASGI Server",
    description: "Blazing fast ASGI implementation handling concurrent client connections.",
  },
  {
    id: "trafilatura",
    name: "Trafilatura",
    ringId: "backend",
    orbitRadius: 121,
    size: 42,
    speed: -0.28,
    phaseShift: (7 * Math.PI) / 4,
    iconSrc: "/brand/icons/Trafilatura.svg",
    brandColor: "#EA580C",
    role: "Web Article Extractor",
    description: "Strips web boilerplate and extracts clean article text, title, and metadata.",
  },

  // --- Ring 3: Database & Retrieval (r = 171) ---
  {
    id: "pinecone",
    name: "Pinecone DB",
    ringId: "database",
    orbitRadius: 171,
    size: 42,
    speed: 0.2,
    phaseShift: 0.2,
    iconSrc: "/brand/icons/pinecone.svg",
    brandColor: "#00C49F",
    role: "Vector Database",
    description: "Managed vector index for high-dimensional perspective embeddings & RAG.",
    invertInDark: true,
  },
  {
    id: "sentence_transformers",
    name: "Sentence Transformers",
    ringId: "database",
    orbitRadius: 171,
    size: 42,
    speed: 0.2,
    phaseShift: 0.2 + (2 * Math.PI) / 3,
    iconSrc: "/brand/icons/huggingface.svg",
    brandColor: "#FFD21E",
    role: "Semantic Embeddings",
    description: "Transforms claim statements into 384-dimensional dense semantic vectors.",
  },
  {
    id: "rag",
    name: "RAG & Search",
    ringId: "database",
    orbitRadius: 171,
    size: 42,
    speed: 0.2,
    phaseShift: 0.2 + (4 * Math.PI) / 3,
    iconSrc: "/brand/icons/RAG.svg",
    brandColor: "#3B82F6",
    role: "Real-Time Verification",
    description: "Fact-checks extracted claims with live internet search & knowledge retrieval.",
    invertInDark: true,
  },

  // --- Outer Ring: Frontend & UI (r = 221) ---
  {
    id: "nextjs",
    name: "Next.js 15",
    ringId: "frontend",
    orbitRadius: 221,
    size: 42,
    speed: -0.15,
    phaseShift: 0.2,
    iconSrc: "/brand/icons/Next.js.svg",
    brandColor: "#18181B",
    role: "App Router & SSR",
    description: "React 19 Server Components, streaming rendering, and zero-bundle layouts.",
    invertInDark: true,
  },
  {
    id: "react",
    name: "React 19",
    ringId: "frontend",
    orbitRadius: 221,
    size: 42,
    speed: -0.15,
    phaseShift: 0.2 + Math.PI / 2,
    iconSrc: "/brand/icons/React.svg",
    brandColor: "#61DAFB",
    role: "Interactive Client UI",
    description: "Stateful hooks, concurrent actions, and responsive component tree.",
  },
  {
    id: "typescript",
    name: "TypeScript",
    ringId: "frontend",
    orbitRadius: 221,
    size: 42,
    speed: -0.15,
    phaseShift: 0.2 + Math.PI,
    iconSrc: "/brand/icons/TypeScript.svg",
    brandColor: "#3178C6",
    role: "Static Type Safety",
    description: "Type-checked interfaces across API contracts, schemas, and UI components.",
  },
  {
    id: "tailwind",
    name: "Tailwind CSS",
    ringId: "frontend",
    orbitRadius: 221,
    size: 42,
    speed: -0.15,
    phaseShift: 0.2 + (3 * Math.PI) / 2,
    iconSrc: "/brand/icons/Tailwind-CSS.svg",
    brandColor: "#06B6D4",
    role: "Adaptive Design System",
    description: "Semantic tokens for seamless Navy Blue and Warm Biscuit dual palettes.",
  },
];

// --- Memoized Orbiting Skill Component ---
interface OrbitingSkillProps {
  config: SkillConfig;
  angle: number;
  isDimmed: boolean;
  isHighlighted: boolean;
  onHover: (hovered: boolean) => void;
}

const OrbitingSkill = memo(
  ({ config, angle, isDimmed, isHighlighted, onHover }: OrbitingSkillProps) => {
    const [isHovered, setIsHovered] = useState(false);
    const { orbitRadius, size, name, role, description, brandColor, iconSrc, invertInDark } = config;

    const x = Math.cos(angle) * orbitRadius;
    const y = Math.sin(angle) * orbitRadius;

    const handleMouseEnter = () => {
      setIsHovered(true);
      onHover(true);
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      onHover(false);
    };

    return (
      <div
        className={clsx(
          "absolute top-1/2 left-1/2 transition-opacity duration-300 will-change-transform",
          isDimmed && "opacity-25 blur-[0.5px]"
        )}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          transform: `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`,
          zIndex: isHovered ? 40 : isHighlighted ? 25 : 15,
        }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <div
          className={clsx(
            "relative w-full h-full p-1.5 sm:p-2 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300",
            "bg-card/90 hover:bg-card border border-border/80 shadow-md backdrop-blur-md",
            isHovered && "scale-125 shadow-2xl border-primary/60",
            isHighlighted && !isHovered && "scale-110 shadow-lg border-primary/40 ring-1 ring-primary/30"
          )}
          style={{
            boxShadow: isHovered
              ? `0 0 25px ${brandColor}60, 0 0 45px ${brandColor}30`
              : isHighlighted
              ? `0 0 15px ${brandColor}40`
              : undefined,
          }}
        >
          <Image
            src={iconSrc}
            alt={name}
            width={size}
            height={size}
            unoptimized
            className={clsx(
              "w-full h-full object-contain pointer-events-none select-none",
              invertInDark && "dark:invert"
            )}
          />

          {/* Interactive Floating Tooltip */}
          {isHovered && (
            <div
              className={clsx(
                "absolute -bottom-14 left-1/2 -translate-x-1/2 px-3 py-1.5 rounded-lg border border-border/90 bg-card/95 backdrop-blur-md shadow-2xl text-center pointer-events-none z-50 whitespace-nowrap",
                "text-foreground animate-in fade-in zoom-in-95 duration-150"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-xs font-semibold">{name}</span>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase bg-secondary/80 text-foreground-muted border border-border/50">
                  {config.ringId}
                </span>
              </div>
              <div className="text-[10px] text-foreground-muted font-medium mt-0.5 max-w-[200px] truncate">
                {role}
              </div>
              <div className="text-[9px] text-foreground-muted opacity-80 max-w-[220px] whitespace-normal leading-tight mt-0.5 hidden sm:block">
                {description}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);
OrbitingSkill.displayName = "OrbitingSkill";

// --- Concentric Ring Path & Single Label Component ---
interface OrbitRingProps {
  ring: RingConfig;
  isActive: boolean;
  isDimmed: boolean;
  onSelect: () => void;
  filterTitle?: string;
}

const OrbitRing = memo(({ ring, isActive, isDimmed, onSelect, filterTitle }: OrbitRingProps) => {
  const { radius, name } = ring;

  return (
    <>
      {/* Concentric Ring SVG Track: 15% more subtle in both Light Mode and Dark Mode */}
      <svg
        className={clsx(
          "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-all duration-500 overflow-visible",
          isDimmed && "opacity-25"
        )}
        width={radius * 2}
        height={radius * 2}
        viewBox={`0 0 ${radius * 2} ${radius * 2}`}
      >
        {/* Soft Ambient Dark Mode Halo */}
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill="none"
          stroke="white"
          strokeWidth={isActive ? "4" : "2"}
          className={clsx(
            "hidden dark:block transition-all duration-500 blur-[2px]",
            isActive ? "opacity-30" : "opacity-10"
          )}
        />

        {/* Primary Orbit Track: 15% more subtle (15% black in light mode, 55% white in dark mode) */}
        <circle
          cx={radius}
          cy={radius}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={isActive ? "2" : "1.25"}
          strokeDasharray={isActive ? "none" : "5 5"}
          className={clsx(
            "transition-all duration-300",
            isActive
              ? "text-black/55 dark:text-white/85"
              : "text-black/15 dark:text-white/55"
          )}
        />
      </svg>

      {/* Concentric Circle Single Name Badge at Apex (12 o'clock) */}
      <div
        className={clsx(
          "absolute left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-auto cursor-pointer transition-all duration-300",
          isDimmed && "opacity-30"
        )}
        style={{
          top: `calc(50% - ${radius}px)`,
        }}
        onClick={onSelect}
        title={filterTitle || `Filter by ${name}`}
      >
        <span
          className={clsx(
            "px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold tracking-widest uppercase border shadow-sm transition-all duration-200 select-none",
            isActive
              ? "bg-primary text-primary-foreground border-primary scale-105 shadow-md"
              : "bg-card/90 hover:bg-card text-foreground/80 hover:text-foreground border-black/15 dark:border-white/35 hover:border-black/30 dark:hover:border-white/60"
          )}
        >
          {name}
        </span>
      </div>
    </>
  );
});
OrbitRing.displayName = "OrbitRing";

// --- Main Orbiting Tech Stack Component ---
export default function OrbitingTechStack() {
  const t = useTranslations("TechStack");
  const [time, setTime] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [activeFilter, setActiveFilter] = useState<RingId | "all">("all");
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // Localized ring definitions
  const rings = useMemo(
    () => [
      {
        id: "ai" as RingId,
        name: t("ringAi"),
        shortName: t("ringAiShort"),
        radius: 70,
        speed: 0.38,
      },
      {
        id: "backend" as RingId,
        name: t("ringBackend"),
        shortName: t("ringBackendShort"),
        radius: 121,
        speed: -0.28,
      },
      {
        id: "database" as RingId,
        name: t("ringDatabase"),
        shortName: t("ringDatabaseShort"),
        radius: 171,
        speed: 0.2,
      },
      {
        id: "frontend" as RingId,
        name: t("ringFrontend"),
        shortName: t("ringFrontendShort"),
        radius: 221,
        speed: -0.15,
      },
    ],
    [t]
  );

  // Localized skill items with translated role and description
  const skills: SkillConfig[] = useMemo(
    () => [
      {
        id: "langgraph",
        name: "LangGraph",
        ringId: "ai",
        orbitRadius: 70,
        size: 42,
        speed: 0.38,
        phaseShift: 0,
        iconSrc: "/brand/icons/langgraph.svg",
        brandColor: "#F97316",
        role: t("langgraphRole"),
        description: t("langgraphDesc"),
      },
      {
        id: "groq",
        name: "Groq LLaMA 3.3",
        ringId: "ai",
        orbitRadius: 70,
        size: 42,
        speed: 0.38,
        phaseShift: Math.PI / 2,
        iconSrc: "/brand/icons/groq.svg",
        brandColor: "#F55036",
        role: t("groqRole"),
        description: t("groqDesc"),
      },
      {
        id: "langchain",
        name: "LangChain",
        ringId: "ai",
        orbitRadius: 70,
        size: 42,
        speed: 0.38,
        phaseShift: Math.PI,
        iconSrc: "/brand/icons/langchain.svg",
        brandColor: "#10B981",
        role: t("langchainRole"),
        description: t("langchainDesc"),
      },
      {
        id: "nltk",
        name: "NLP & NLTK",
        ringId: "ai",
        orbitRadius: 70,
        size: 42,
        speed: 0.38,
        phaseShift: (3 * Math.PI) / 2,
        iconSrc: "/brand/icons/nltk.svg",
        brandColor: "#8B5CF6",
        role: t("nltkRole"),
        description: t("nltkDesc"),
      },
      {
        id: "fastapi",
        name: "FastAPI",
        ringId: "backend",
        orbitRadius: 121,
        size: 42,
        speed: -0.28,
        phaseShift: Math.PI / 4,
        iconSrc: "/brand/icons/FastAPI.svg",
        brandColor: "#009688",
        role: t("fastapiRole"),
        description: t("fastapiDesc"),
      },
      {
        id: "python",
        name: "Python 3.13",
        ringId: "backend",
        orbitRadius: 121,
        size: 42,
        speed: -0.28,
        phaseShift: (3 * Math.PI) / 4,
        iconSrc: "/brand/icons/Python.svg",
        brandColor: "#387EB8",
        role: t("pythonRole"),
        description: t("pythonDesc"),
      },
      {
        id: "uvicorn",
        name: "Uvicorn",
        ringId: "backend",
        orbitRadius: 121,
        size: 42,
        speed: -0.28,
        phaseShift: (5 * Math.PI) / 4,
        iconSrc: "/brand/icons/uvicorn.svg",
        brandColor: "#9333EA",
        role: t("uvicornRole"),
        description: t("uvicornDesc"),
      },
      {
        id: "trafilatura",
        name: "Trafilatura",
        ringId: "backend",
        orbitRadius: 121,
        size: 42,
        speed: -0.28,
        phaseShift: (7 * Math.PI) / 4,
        iconSrc: "/brand/icons/Trafilatura.svg",
        brandColor: "#EA580C",
        role: t("trafilaturaRole"),
        description: t("trafilaturaDesc"),
      },
      {
        id: "pinecone",
        name: "Pinecone DB",
        ringId: "database",
        orbitRadius: 171,
        size: 42,
        speed: 0.2,
        phaseShift: 0.2,
        iconSrc: "/brand/icons/pinecone.svg",
        brandColor: "#00C49F",
        role: t("pineconeRole"),
        description: t("pineconeDesc"),
        invertInDark: true,
      },
      {
        id: "sentence_transformers",
        name: "Sentence Transformers",
        ringId: "database",
        orbitRadius: 171,
        size: 42,
        speed: 0.2,
        phaseShift: 0.2 + (2 * Math.PI) / 3,
        iconSrc: "/brand/icons/huggingface.svg",
        brandColor: "#FFD21E",
        role: t("sentenceTransformersRole"),
        description: t("sentenceTransformersDesc"),
      },
      {
        id: "rag",
        name: "RAG & Search",
        ringId: "database",
        orbitRadius: 171,
        size: 42,
        speed: 0.2,
        phaseShift: 0.2 + (4 * Math.PI) / 3,
        iconSrc: "/brand/icons/RAG.svg",
        brandColor: "#3B82F6",
        role: t("ragRole"),
        description: t("ragDesc"),
        invertInDark: true,
      },
      {
        id: "nextjs",
        name: "Next.js 15",
        ringId: "frontend",
        orbitRadius: 221,
        size: 42,
        speed: -0.15,
        phaseShift: 0.2,
        iconSrc: "/brand/icons/Next.js.svg",
        brandColor: "#18181B",
        role: t("nextjsRole"),
        description: t("nextjsDesc"),
        invertInDark: true,
      },
      {
        id: "react",
        name: "React 19",
        ringId: "frontend",
        orbitRadius: 221,
        size: 42,
        speed: -0.15,
        phaseShift: 0.2 + Math.PI / 2,
        iconSrc: "/brand/icons/React.svg",
        brandColor: "#61DAFB",
        role: t("reactRole"),
        description: t("reactDesc"),
      },
      {
        id: "typescript",
        name: "TypeScript",
        ringId: "frontend",
        orbitRadius: 221,
        size: 42,
        speed: -0.15,
        phaseShift: 0.2 + Math.PI,
        iconSrc: "/brand/icons/TypeScript.svg",
        brandColor: "#3178C6",
        role: t("typescriptRole"),
        description: t("typescriptDesc"),
      },
      {
        id: "tailwind",
        name: "Tailwind CSS",
        ringId: "frontend",
        orbitRadius: 221,
        size: 42,
        speed: -0.15,
        phaseShift: 0.2 + (3 * Math.PI) / 2,
        iconSrc: "/brand/icons/Tailwind-CSS.svg",
        brandColor: "#06B6D4",
        role: t("tailwindRole"),
        description: t("tailwindDesc"),
      },
    ],
    [t]
  );

  // Dynamic responsive auto-scale to ensure 0 vertical or horizontal scrolling
  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      if (clientWidth === 0 || clientHeight === 0) return;

      // Base canvas coordinates are 486x486
      const baseSize = 486;
      const padding = 12;
      // Reserve space for the filter buttons so both circles AND buttons always fit without clipping
      const legendHeight = 52;
      const factorW = (clientWidth - padding) / baseSize;
      const factorH = (clientHeight - padding - legendHeight) / baseSize;
      const fit = Math.min(factorW, factorH, 1.0);

      setScale(Math.max(0.35, Math.min(fit, 1.0)));
    };

    updateScale();
    const ro = new ResizeObserver(updateScale);
    if (containerRef.current) {
      ro.observe(containerRef.current);
    }
    window.addEventListener("resize", updateScale);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  // Orbital mechanics animation loop: runs at native display refresh rate (60Hz/120Hz)
  useEffect(() => {
    if (isPaused) return;

    let animId: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      // Clamp delta to prevent sudden position leaps when switching tabs
      const delta = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      setTime((prev) => prev + delta);
      animId = requestAnimationFrame(animate);
    };

    animId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animId);
  }, [isPaused]);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex-1 min-h-0 flex flex-col items-center justify-center overflow-hidden select-none"
    >
      {/* Scaled Layout Wrapper: ensures flex layout reflects the actual scaled height */}
      <div
        className="relative shrink-0 flex items-center justify-center"
        style={{
          width: `${Math.round(486 * scale)}px`,
          height: `${Math.round(486 * scale)}px`,
        }}
      >
        {/* Dynamic Scaled Canvas */}
        <div
          className="relative shrink-0 flex items-center justify-center transition-transform duration-200"
          style={{
            width: "486px",
            height: "486px",
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
        {/* Central Hub: Perspective Spectacles Brand Icon (Black in light mode, white in dark mode) */}
        <div
          className={clsx(
            "w-[72px] h-[72px] rounded-full flex flex-col items-center justify-center z-30 relative shadow-2xl transition-all duration-300",
            "bg-card/90 border border-border backdrop-blur-md cursor-pointer hover:scale-105"
          )}
          onClick={() => setActiveFilter("all")}
          title={t("coreTooltip")}
        >
          {/* Ambient Pulse Aura */}
          <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
          <div className="absolute inset-[-4px] rounded-full border border-primary/20 pointer-events-none" />

          <div className="relative z-10 flex flex-col items-center justify-center">
            {/* Exactly matches the navbar's topic variant logo: black in light mode, white in dark mode */}
            <PerspectiveLogo variant="topic" className="h-4 sm:h-5 w-auto text-black dark:text-white" />
            <span className="text-[8px] font-bold tracking-widest uppercase text-black/80 dark:text-white/80 mt-1">
              {t("core")}
            </span>
          </div>
        </div>

        {/* Concentric Orbit Paths & Names (Single apex label, no right-side duplicate) */}
        {rings.map((ring) => {
          const isActive = activeFilter === ring.id;
          const isDimmed = activeFilter !== "all" && !isActive;

          return (
            <OrbitRing
              key={ring.id}
              ring={ring}
              isActive={isActive}
              isDimmed={isDimmed}
              filterTitle={t("filterBy", { name: ring.name })}
              onSelect={() =>
                setActiveFilter((curr) => (curr === ring.id ? "all" : ring.id))
              }
            />
          );
        })}

        {/* Orbiting Technology Icons loaded from brand/icons/ */}
        {skills.map((config) => {
          const isHighlighted = activeFilter === config.ringId;
          const isDimmed = activeFilter !== "all" && !isHighlighted;
          const angle = time * config.speed + config.phaseShift;

          return (
            <OrbitingSkill
              key={config.id}
              config={config}
              angle={angle}
              isDimmed={isDimmed}
              isHighlighted={isHighlighted}
              onHover={(hovered) => setIsPaused(hovered)}
            />
          );
        })}
        </div>
      </div>

      {/* Interactive Concentric Rings Filter Legend: Mobile responsive with wrapping & central alignment */}
      <div className="shrink-0 flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full px-2 sm:px-4 mt-1 sm:mt-2 z-30">
        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={clsx(
            "px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border transition-all cursor-pointer whitespace-nowrap shrink-0",
            activeFilter === "all"
              ? "bg-primary text-primary-foreground border-primary shadow-sm"
              : "bg-card/70 hover:bg-card text-foreground-muted hover:text-foreground border-border/70"
          )}
        >
          {t("allTech", { count: skills.length })}
        </button>

        {rings.map((ring) => {
          const count = skills.filter((s) => s.ringId === ring.id).length;
          const isActive = activeFilter === ring.id;

          return (
            <button
              key={ring.id}
              type="button"
              onClick={() =>
                setActiveFilter((curr) => (curr === ring.id ? "all" : ring.id))
              }
              className={clsx(
                "px-2.5 sm:px-3 py-1 rounded-full text-[10px] sm:text-xs font-semibold tracking-wide border transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                isActive
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card/70 hover:bg-card text-foreground-muted hover:text-foreground border-border/70"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-black/25 dark:bg-white/60" />
              <span>{ring.shortName}</span>
              <span className="text-[9px] opacity-75">({count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
