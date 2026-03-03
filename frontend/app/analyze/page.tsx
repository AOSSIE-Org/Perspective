"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const router = useRouter();

  // Custom Cursor state
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setTimeout(() => {
        setRingPos({ x: e.clientX - 11, y: e.clientY - 11 });
      }, 50);
    };
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  const validateUrl = (inputUrl: string) => {
    try {
      const parsedUrl = new URL(inputUrl);
      if (parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:") {
        setIsValidUrl(true);
      } else {
        setIsValidUrl(false);
      }
    } catch {
      setIsValidUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    if (inputUrl.length > 0) {
      validateUrl(inputUrl);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleAnalyze = () => {
    if (isValidUrl && url) {
      sessionStorage.setItem("articleUrl", url);
      router.push("/analyze/loading");
    }
  };

  return (
    <div className="bg-background-light dark:bg-background-dark font-display text-slate-900 dark:text-slate-100 min-h-screen selection:bg-primary/30 flex flex-col grid-pattern">
      {/* Custom Cursor */}
      <div className="custom-cursor hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y }}></div>
      <div className="custom-cursor-ring hidden md:block" style={{ left: ringPos.x, top: ringPos.y }}></div>

      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-black/5 dark:border-white/5 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div
          className="flex items-center gap-3 cursor-none focus-visible:outline-primary focus-visible:outline-2 rounded"
          onClick={() => router.push("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              router.push("/");
            }
          }}
        >
          <div className="text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">science</span>
          </div>
          <h2 className="text-primary text-lg font-bold tracking-tight glow-text">Perspective-AI</h2>
        </div>
        <div className="hidden md:flex gap-10 font-mono text-[11px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
          <a className="hover:text-primary transition-colors cursor-none" href="/#features">Features</a>
          <a className="hover:text-primary transition-colors cursor-none" href="/#how-it-works">How It Works</a>
          <a className="hover:text-primary transition-colors cursor-none" href="/#pipeline">Pipeline</a>
          <a className="hover:text-primary transition-colors cursor-none" href="/#stack">Stack</a>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-2xl mx-auto w-full relative z-10">
        <div className="text-center mb-10 space-y-4">
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-2">
            System Node: Active
          </span>
          <h1 className="text-slate-900 dark:text-slate-100 font-serif text-4xl md:text-5xl leading-tight">
            Enter the <span className="italic text-primary">Echo Chamber</span>
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base font-light leading-relaxed max-w-sm mx-auto">
            Paste any article URL below for deep narrative parsing and counter-perspective synthesis.
          </p>
        </div>

        {/* Glassmorphic Input Card */}
        <div className="w-full glass-card rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden group bg-white/40 dark:bg-black/40">
          <div className="absolute top-0 left-0 w-1 h-full bg-primary/40"></div>
          <div className="space-y-6">
            <div>
              <label className="block font-mono text-primary text-xs tracking-widest uppercase mb-3 flex items-center gap-2 cursor-none">
                <span className="material-symbols-outlined text-sm">terminal</span>
                TARGET_URL &gt;
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={url}
                  onChange={handleUrlChange}
                  className="w-full bg-white/50 dark:bg-black/40 border border-black/10 dark:border-white/10 rounded-lg py-4 px-4 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-mono text-sm cursor-none"
                  placeholder="https://example.com/analysis-target"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500">
                  {url && isValidUrl ? (
                    <span className="material-symbols-outlined text-sm text-green-500">check_circle</span>
                  ) : url && !isValidUrl ? (
                    <span className="material-symbols-outlined text-sm text-red-500">error</span>
                  ) : (
                    <span className="material-symbols-outlined text-sm">link</span>
                  )}
                </div>
              </div>
              {url && !isValidUrl && (
                <p className="font-mono text-[10px] text-red-500 mt-2 ml-2 uppercase tracking-widest">Error: Invalid Target URL</p>
              )}
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleAnalyze}
                disabled={!isValidUrl || !url}
                className="w-full bg-primary text-background-dark font-bold py-4 rounded-lg flex items-center justify-center gap-2 uppercase tracking-widest text-sm glow-button transition-transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-none cursor-none disabled:hover:shadow-none hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined">bolt</span>
                Analyze Article
              </button>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                <span>Baudrillard-Lacan Protocol V.4.2</span>
                <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Node Status: Ready</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Feed Simulation */}
        <div className="mt-12 w-full max-w-lg">
          <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-2">
            <h3 className="text-slate-500 text-[10px] font-bold tracking-[0.2em] uppercase">Global Feed</h3>
            <span className="text-primary text-[10px] animate-pulse">● LIVE</span>
          </div>
          <div className="space-y-3">
            {[
              {
                icon: "newspaper",
                title: "The Future of Decentralized Intelligence",
                status: "Analysis Complete - 98% Confidence",
                url: "https://www.theguardian.com/technology/2026/future-of-ai",
              },
              {
                icon: "public",
                title: "Geopolitical Shifts in the Silicon Era",
                status: "Counter-Narrative Generated",
                url: "https://www.reuters.com/world/geopolitics",
              }
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-4 p-3 rounded-lg border border-black/5 dark:border-white/5 bg-white/30 dark:bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-colors group cursor-none"
                onClick={() => {
                  setUrl(item.url);
                  validateUrl(item.url);
                }}
              >
                <div className="size-10 rounded bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">{item.title}</p>
                  <p className="text-[10px] text-slate-500 font-mono italic">{item.status}</p>
                </div>
                <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-lg">chevron_right</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Basic Particle Mesh Layer */}
      <div className="fixed inset-0 pointer-events-none particle-mesh opacity-30 dark:opacity-20 z-0"></div>

    </div>
  );
}
