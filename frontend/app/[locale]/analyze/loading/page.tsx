"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Globe, Brain, Shield, CheckCircle, Database, Zap } from "lucide-react";
import axios from "axios";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "https://thunder1245-perspective-backend.hf.space";

export default function LoadingPage() {
  const t = useTranslations("AnalyzeLoading");
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [articleUrl, setArticleUrl] = useState("");
  const router = useRouter();

  const steps = useMemo(
    () => [
      { icon: Globe, title: t("step1Title"), description: t("step1Desc") },
      { icon: Brain, title: t("step2Title"), description: t("step2Desc") },
      { icon: Shield, title: t("step3Title"), description: t("step3Desc") },
      { icon: CheckCircle, title: t("step4Title"), description: t("step4Desc") },
      { icon: Database, title: t("step5Title"), description: t("step5Desc") },
    ],
    [t]
  );

  useEffect(() => {
    let cancelled = false;
    let stepInterval: ReturnType<typeof setInterval> | null = null;
    let progressInterval: ReturnType<typeof setInterval> | null = null;
    let navTimeout: ReturnType<typeof setTimeout> | null = null;

    const runAnalysis = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      if (!storedUrl) {
        if (!cancelled) router.push("/");
        return;
      }

      if (!cancelled) setArticleUrl(storedUrl);

      // Check if we already have pre-computed results (e.g. from preset topics)
      const existingResult = sessionStorage.getItem("analysisResult");
      if (existingResult) {
        if (cancelled) return;
        setProgress(100);
        setCurrentStep(steps.length - 1);
        navTimeout = setTimeout(() => {
          if (!cancelled) router.push("/analyze/results");
        }, 1200);
        return;
      }

      try {
        const [processRes, biasRes] = await Promise.all([
          axios.post(`${BACKEND_BASE}/api/process`, { url: storedUrl }, { timeout: 90000 }),
          axios.post(`${BACKEND_BASE}/api/bias`, { url: storedUrl }, { timeout: 90000 }),
        ]);

        if (cancelled) return;
        sessionStorage.setItem("BiasScore", JSON.stringify(biasRes.data));
        sessionStorage.setItem("analysisResult", JSON.stringify(processRes.data));
      } catch {
        if (cancelled) return;
        sessionStorage.setItem("analysisResult", JSON.stringify({ error: true }));
        sessionStorage.setItem("BiasScore", JSON.stringify({ bias_score: 0 }));
      }

      if (cancelled) return;

      stepInterval = setInterval(() => {
        if (cancelled) {
          if (stepInterval) clearInterval(stepInterval);
          return;
        }
        setCurrentStep((prev) => {
          if (prev < steps.length - 1) {
            return prev + 1;
          } else {
            if (stepInterval) clearInterval(stepInterval);
            navTimeout = setTimeout(() => {
              if (!cancelled) router.push("/analyze/results");
            }, 800);
            return prev;
          }
        });
      }, 1200);

      progressInterval = setInterval(() => {
        if (cancelled) {
          if (progressInterval) clearInterval(progressInterval);
          return;
        }
        setProgress((prev) => (prev < 100 ? prev + 1 : prev));
      }, 60);
    };

    runAnalysis();

    return () => {
      cancelled = true;
      if (stepInterval) clearInterval(stepInterval);
      if (progressInterval) clearInterval(progressInterval);
      if (navTimeout) clearTimeout(navTimeout);
    };
  }, [router, steps.length]);

  return (
    <div className="relative w-full h-full max-w-2xl mx-auto px-4 pt-3 sm:pt-6 md:pt-10 lg:pt-12 pb-4 sm:pb-6 flex flex-col justify-between overflow-y-auto md:overflow-hidden text-center select-none">
      {/* Top Header */}
      <div className="shrink-0">
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-brand-border bg-card/60 text-foreground text-xs font-medium tracking-wide transition-all shadow-sm mb-2 sm:mb-4 animate-pulse">
          <Zap className="w-3.5 h-3.5 text-warning" />
          <span>{t("badge")}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-aura md:whitespace-nowrap pt-2 sm:pt-6 md:pt-12">
          {t("title")}
        </h1>
        <p className="text-xs text-foreground-muted truncate max-w-md mx-auto mt-2 sm:mt-4 mb-3 sm:mb-6 font-mono bg-card/60 px-3.5 py-1.5 rounded-[4px] border border-border/70">
          {articleUrl || t("processingSource")}
        </p>

        {/* Progress Bar */}
        <div className="w-full bg-secondary/80 rounded-full h-2 mb-1.5 overflow-hidden border border-border/60">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${Math.min(progress, (currentStep + 1) * 20)}%` }}
          />
        </div>
        <p className="text-xs font-medium text-foreground-muted opacity-80">
          {t("percentComplete", { percent: Math.min(progress, (currentStep + 1) * 20) })}
        </p>
      </div>

      {/* Steps List */}
      <div className="space-y-2.5 text-left my-auto">
        {steps.map((st, i) => {
          const Icon = st.icon;
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;
          return (
            <div
              key={i}
              className={`p-3 sm:p-3.5 rounded-xl border transition-all duration-300 flex items-center gap-3.5 ${
                isCurrent
                  ? "border-ring bg-card shadow-md scale-[1.01]"
                  : isDone
                  ? "border-border/70 bg-card/60 opacity-90"
                  : "border-border/40 bg-card/30 opacity-50"
              }`}
            >
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isDone
                    ? "bg-success/20 text-success"
                    : isCurrent
                    ? "bg-primary text-primary-foreground animate-pulse"
                    : "bg-secondary text-foreground-muted"
                }`}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs sm:text-sm font-semibold text-foreground truncate">{st.title}</div>
                <div className="text-xs text-foreground-muted truncate opacity-85">{st.description}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Note */}
      <div className="shrink-0 text-xs text-foreground-muted opacity-80">
        {t("footer")}
      </div>
    </div>
  );
}
