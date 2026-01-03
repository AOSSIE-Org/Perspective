"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Brain,
  Shield,
  CheckCircle,
  Database,
  Sparkles,
  Loader2,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import axios from "axios";

// Backend URL from environment variable with fallback
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "https://thunder1245-perspective-backend.hf.space";

// API timeout in milliseconds (60 seconds)
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "60000", 10);

// Simple logger utility that respects NODE_ENV
const logger = {
  debug: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[DEBUG]', ...args);
    }
  },
  error: (...args: any[]) => {
    console.error('[ERROR]', ...args);
  }
};

export default function LoadingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [articleUrl, setArticleUrl] = useState("");
  const router = useRouter();

  const steps = [
    {
      icon: Globe,
      title: "Fetching Article",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Shield,
      title: "Bias Detection",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: CheckCircle,
      title: "Fact Checking",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Database,
      title: "Generating Perspectives",
      color: "from-pink-500 to-rose-500",
    },
  ];

  useEffect(() => {
    let stepInterval: NodeJS.Timeout | null = null;
    let progressInterval: NodeJS.Timeout | null = null;
    let isMounted = true;

    const runAnalysis = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      if (storedUrl) {
        setArticleUrl(storedUrl);

        try {
          const [processRes, biasRes] = await Promise.all([
            axios.post(
              `${BACKEND_URL}/api/process`,
              { url: storedUrl },
              { timeout: API_TIMEOUT }
            ),
            axios.post(
              `${BACKEND_URL}/api/bias`,
              { url: storedUrl },
              { timeout: API_TIMEOUT }
            ),
          ]);

          sessionStorage.setItem("BiasScore", JSON.stringify(biasRes.data));
          logger.debug("Bias score saved", biasRes.data);

          sessionStorage.setItem(
            "analysisResult",
            JSON.stringify(processRes.data)
          );

          logger.debug("Analysis result saved", processRes.data);
        } catch (err) {
          // Enhanced error logging with timeout detection
          if (axios.isAxiosError(err)) {
            if (err.code === 'ECONNABORTED') {
              logger.error("Request timeout - backend took too long to respond:", err);
            } else if (err.response) {
              logger.error("Backend error response:", err.response.status, err.response.data);
            } else if (err.request) {
              logger.error("No response received from backend:", err.message);
            } else {
              logger.error("Request setup error:", err.message);
            }
          } else {
            logger.error("Failed to process article:", err);
          }
          
          if (isMounted) {
            router.push("/analyze");
          }
          return;
        }

        // Don't start intervals if component already unmounted
        if (!isMounted) return;

        stepInterval = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev < steps.length - 1) {
              return prev + 1;
            } else {
              if (stepInterval) clearInterval(stepInterval);
              setTimeout(() => {
                if (isMounted) {
                  router.push("/analyze/results");
                }
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

    // Cleanup function returned directly from useEffect
    return () => {
      isMounted = false;
      if (stepInterval) clearInterval(stepInterval);
      if (progressInterval) clearInterval(progressInterval);
    };
  }, [router, steps.length]);

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 transition-colors duration-300 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/15 to-purple-400/15 dark:from-blue-400/8 dark:to-purple-400/8 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/15 to-cyan-400/15 dark:from-emerald-400/8 dark:to-cyan-400/8 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-50 flex-shrink-0">
        <div className="container mx-auto px-4 lg:px-6 py-3 flex items-center justify-between max-w-7xl">
          <div
            className="flex items-center space-x-2.5 group cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Globe className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perspective
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content - Centered with flex */}
      <main className="flex-1 flex items-center justify-center px-4 lg:px-6 py-6 relative z-10">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            
            {/* Left: Title & Progress */}
            <div className="space-y-4">
              <Badge className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-4 py-1.5 text-sm font-medium shadow-lg inline-flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-pulse" />
                AI Processing
              </Badge>

              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
                Analyzing Your Article
              </h1>

              {/* Article URL */}
              <div className="px-3 py-2 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm rounded-lg border border-slate-200/50 dark:border-slate-700/50 flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin flex-shrink-0" />
                <div className="overflow-hidden flex-1">
                  <p className="text-xs text-slate-500 dark:text-slate-400">Processing</p>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                    {articleUrl}
                  </p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Progress
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {Math.min(progress, (currentStep + 1) * 20)}%
                  </span>
                </div>
                
                <div className="relative w-full h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 ease-out"
                    style={{
                      width: `${Math.min(progress, (currentStep + 1) * 20)}%`,
                    }}
                  >
                    <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                  </div>
                </div>
              </div>

              <p className="text-sm text-slate-600 dark:text-slate-400">
                Our AI is analyzing content and generating balanced perspectives
              </p>
            </div>

            {/* Right: Processing Steps */}
            <div className="space-y-2.5">
              {steps.map((step, index) => {
                const isActive = index === currentStep;
                const isComplete = index < currentStep;

                return (
                  <div
                    key={index}
                    className={`relative p-3 rounded-xl backdrop-blur-sm border transition-all duration-500 ${
                      isActive
                        ? "bg-white dark:bg-slate-800 shadow-lg scale-[1.02] border-blue-500/50"
                        : isComplete
                        ? "bg-white/60 dark:bg-slate-800/60 shadow border-emerald-500/30"
                        : "bg-white/40 dark:bg-slate-800/40 shadow-sm border-slate-200/50 dark:border-slate-700/50 opacity-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Icon */}
                      <div
                        className={`relative w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                          isActive
                            ? `bg-gradient-to-br ${step.color} shadow-md`
                            : isComplete
                            ? "bg-gradient-to-br from-emerald-500 to-teal-500"
                            : "bg-slate-200 dark:bg-slate-700"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : isActive ? (
                          <>
                            <step.icon className="w-5 h-5 text-white" />
                            <div className="absolute inset-0 rounded-lg bg-white/20 animate-ping"></div>
                          </>
                        ) : (
                          <step.icon className="w-5 h-5 text-slate-400" />
                        )}
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-sm transition-colors duration-300 ${
                            isActive
                              ? "text-blue-600 dark:text-blue-400"
                              : isComplete
                              ? "text-emerald-600 dark:text-emerald-400"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {step.title}
                        </h3>
                      </div>

                      {/* Status Indicator */}
                      {isActive && (
                        <div className="flex gap-1 flex-shrink-0">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></div>
                          <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                          <div className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        </div>
                      )}
                      
                      {isComplete && (
                        <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
