"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

export default function LoadingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [articleUrl, setArticleUrl] = useState("");
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

  const steps = [
    {
      title: "Fetching Article",
      subtitleVerified: "Node Verified",
      subtitlePending: "Awaiting Source",
    },
    {
      title: "AI Analysis",
      subtitleVerified: "Entropy Mapped",
      subtitlePending: "Parsing Logic",
    },
    {
      title: "Bias Detection",
      subtitleVerified: "Cognitive Filter Applied",
      subtitlePending: "Scanning Narratives",
    },
    {
      title: "Fact Checking",
      subtitleVerified: "Cross-Reference Complete",
      subtitlePending: "Querying Database",
    },
    {
      title: "Generating Perspectives",
      subtitleVerified: "Analysis Result",
      subtitlePending: "Synthesizing"
    },
  ];

  useEffect(() => {
    let stepInterval: ReturnType<typeof setInterval>;
    let progressInterval: ReturnType<typeof setInterval>;

    const runAnalysis = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      if (storedUrl) {
        setArticleUrl(storedUrl);

        try {
          const [processRes, biasRes] = await Promise.all([
            axios.post("https://thunder1245-perspective-backend.hf.space/api/process", {
              url: storedUrl,
            }),
            axios.post("https://thunder1245-perspective-backend.hf.space/api/bias", {
              url: storedUrl,
            }),
          ]);

          sessionStorage.setItem("BiasScore", JSON.stringify(biasRes.data));
          sessionStorage.setItem("analysisResult", JSON.stringify(processRes.data));

        } catch (err) {
          console.error("Failed to process article:", err);
          router.push("/analyze"); // fallback in case of error
          return;
        }

        // Progress and step simulation
        stepInterval = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev < 4) { // hardcode 4 since steps.length removed from dep array
              return prev + 1;
            } else {
              clearInterval(stepInterval);
              setTimeout(() => {
                router.push("/analyze/results");
              }, 2000);
              return prev;
            }
          });
        }, 2000);

        progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 100) {
              return prev + 1;
            }
            return prev;
          });
        }, 100);

      } else {
        router.push("/analyze");
      }
    };

    runAnalysis();

    return () => {
      clearInterval(stepInterval);
      clearInterval(progressInterval);
    };
  }, [router]);

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen selection:bg-primary/30 flex flex-col grid-pattern">
      {/* Custom Cursor */}
      <div className="custom-cursor hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y }}></div>
      <div className="custom-cursor-ring hidden md:block" style={{ left: ringPos.x, top: ringPos.y }}></div>

      {/* Top Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-background-dark/80 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center gap-2 cursor-none" onClick={() => router.push("/")}>
          <span className="material-symbols-outlined text-primary text-2xl">lens_blur</span>
          <span className="font-bold tracking-tight text-lg uppercase">Perspective-AI</span>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col p-6 max-w-xl mx-auto w-full gap-8 z-10 relative">
        {/* Header */}
        <header className="text-center space-y-2 mt-4">
          <h1 className="font-serif text-3xl md:text-4xl italic text-slate-100">Initiating Narrative Synthesis...</h1>
          <p className="text-primary/60 text-xs font-mono tracking-widest uppercase">System Core v4.0.2</p>
        </header>

        {/* Terminal Box */}
        <div className="glass-card rounded-xl p-4 font-mono text-xs overflow-hidden relative border border-white/5 bg-white/5 backdrop-blur-[12px]">
          <div className="flex items-center gap-2 mb-3 border-b border-white/5 pb-2">
            <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-yellow-500/50"></div>
            <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
            <span className="ml-2 text-primary/40 uppercase tracking-widest">TARGET_INPUT</span>
          </div>
          <div className="flex flex-col gap-1 pr-10">
            <span className="text-primary/70">Source:</span>
            <span className="text-slate-300 break-all">{articleUrl || "Awaiting URL..."}</span>
          </div>
          <div className="absolute right-2 bottom-2 opacity-10">
            <span className="material-symbols-outlined text-4xl">terminal</span>
          </div>
        </div>

        {/* Central Circular Loader */}
        <div className="relative flex justify-center items-center py-6">
          <div className="relative w-48 h-48 flex items-center justify-center">
            {/* Outer Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-primary/20 border-t-primary animate-[spin_3s_linear_infinite]"></div>

            {/* Inner Ring */}
            <div className="absolute inset-4 rounded-full border border-primary/10 border-b-primary/60 animate-[spin_2s_linear_infinite_reverse]"></div>

            {/* Technical Motif Center */}
            <div className="glass-card w-32 h-32 rounded-full flex flex-col items-center justify-center border border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(6,224,249,0.2)]">
              <span className="material-symbols-outlined text-primary text-4xl animate-pulse">psychology</span>
              <span className="text-[10px] font-mono text-primary mt-2 uppercase tracking-tighter">{Math.min(progress, 100)}%</span>
            </div>
          </div>
        </div>

        {/* Processing Nodes */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={index} className="flex items-center gap-4 group">
                <div className="flex flex-col items-center">
                  {isCompleted ? (
                    <div className="w-8 h-8 rounded-full border border-yellow-500/50 flex items-center justify-center bg-yellow-500/10">
                      <span className="material-symbols-outlined text-yellow-500 text-lg">check</span>
                    </div>
                  ) : isActive ? (
                    <div className="w-8 h-8 rounded-full border border-primary flex items-center justify-center bg-primary/20 shadow-[0_0_15px_rgba(6,224,249,0.4)] animate-pulse">
                      <span className="material-symbols-outlined text-primary text-lg">settings_suggest</span>
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center bg-white/5">
                      <div className="w-2 h-2 rounded-full bg-white/20"></div>
                    </div>
                  )}
                  {index < steps.length - 1 && (
                    <div className={`w-px h-6 my-1 ${isCompleted ? 'bg-yellow-500/30' : isActive ? 'bg-primary/30' : 'bg-white/10'}`}></div>
                  )}
                </div>

                <div className={`flex-1 ${index < steps.length - 1 ? 'pb-4' : ''}`}>
                  <h3 className={`text-sm font-bold tracking-wide ${isActive || isCompleted ? 'text-white' : 'text-slate-500'}`}>{step.title}</h3>

                  {isActive ? (
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-primary shadow-[0_0_8px_#06e0f9] transition-all duration-300" style={{ width: `${(progress % 20) * 5}%` }}></div>
                      </div>
                      <span className="text-[10px] font-mono text-primary animate-pulse uppercase">Active</span>
                    </div>
                  ) : (
                    <p className={`text-[10px] font-mono uppercase ${isCompleted ? 'text-yellow-500/60' : 'text-slate-600'}`}>
                      {isCompleted ? step.subtitleVerified : step.subtitlePending}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Basic Particle Mesh Layer */}
      <div className="fixed inset-0 pointer-events-none particle-mesh opacity-30 dark:opacity-40 z-0 mix-blend-screen"></div>

    </div>
  );
}
