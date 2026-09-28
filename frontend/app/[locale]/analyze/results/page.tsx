"use client";

import { useState, useEffect } from "react";
import { useRouter, Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, MessageSquare, Shield, CheckCircle2, Sparkles, ExternalLink, Send } from "lucide-react";
import BiasMeter from "@/components/bias-meter";
import axios from "axios";

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL || "https://thunder1245-perspective-backend.hf.space";

interface FactItem {
  claim?: string;
  original_claim?: string;
  verified?: boolean;
  verdict?: string;
  explanation?: string;
  sources?: string[];
  details?: string;
}

interface PerspectiveObject {
  perspective?: string;
  reasoning?: string;
}

interface AnalysisResult {
  facts?: (string | FactItem)[];
  sentiment?: string;
  perspective?: string | PerspectiveObject;
  score?: number;
  cleaned_text?: string;
}

export default function ResultsPage() {
  const router = useRouter();
  const t = useTranslations("AnalyzeResults");
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null);
  const [biasScore, setBiasScore] = useState<number>(45);
  const [articleUrl, setArticleUrl] = useState<string>("");
  const [topicTitle, setTopicTitle] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"perspective" | "facts" | "chat">("perspective");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "assistant",
      content: t("chatGreeting"),
    },
  ]);

  useEffect(() => {
    const storedUrl = sessionStorage.getItem("articleUrl");
    const storedTopic = sessionStorage.getItem("selectedTopicTitle");
    const storedBias = sessionStorage.getItem("BiasScore");
    const storedResult = sessionStorage.getItem("analysisResult");

    if (storedUrl) setArticleUrl(storedUrl);
    if (storedTopic) setTopicTitle(storedTopic);

    if (storedBias) {
      try {
        const parsed = JSON.parse(storedBias);
        const scoreVal = typeof parsed === "number" ? parsed : parsed?.bias_score;
        setBiasScore(typeof scoreVal === "number" ? scoreVal : 45);
      } catch {
        setBiasScore(45);
      }
    }

    if (storedResult) {
      try {
        setAnalysisData(JSON.parse(storedResult));
      } catch (e) {
        console.error("Failed to parse analysis result:", e);
      }
    } else {
      router.push("/");
    }
  }, [router]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const userMsg = message.trim();
    const updated = [...messages, { role: "user", content: userMsg }];
    setMessages(updated);
    setMessage("");
    setIsSending(true);

    try {
      const res = await axios.post(
        `${BACKEND_BASE}/api/chat`,
        { message: userMsg },
        { timeout: 30000 }
      );
      setMessages([...updated, { role: "assistant", content: res.data.answer }]);
    } catch {
      setMessages([
        ...updated,
        {
          role: "assistant",
          content: t("chatFallback"),
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  if (!analysisData) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <div className="w-7 h-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-foreground-muted font-medium">{t("loadingReport")}</p>
        </div>
      </div>
    );
  }

  const { facts = [], sentiment, perspective, score = 85 } = analysisData;

  return (
    <div className="relative w-full h-full max-w-6xl mx-auto px-4 pt-4 sm:pt-6 pb-3 sm:pb-4 flex flex-col justify-between overflow-hidden select-none">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between pb-2.5 border-b border-border/50 shrink-0">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            prefetch={true}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("home")}</span>
          </Link>
          <span className="text-foreground-muted text-xs opacity-60">•</span>
          <h1 className="text-xs sm:text-sm font-semibold text-foreground truncate max-w-[280px] sm:max-w-md">
            {topicTitle || t("defaultTitle")}
          </h1>
        </div>

        {articleUrl && (
          <a
            href={articleUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-primary transition-colors truncate max-w-[220px]"
          >
            <span className="truncate">{articleUrl}</span>
            <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
          </a>
        )}
      </div>

      {/* Main Content: vertical stack (scrollable) on mobile, 3-col grid on lg+ */}
      <div className="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-3 gap-3.5 my-2.5 overflow-y-auto lg:overflow-hidden">
        {/* Left Column / Top Section (2 Cols on lg): Tabbed Insights */}
        <div className="lg:col-span-2 flex flex-col min-h-0 overflow-hidden">
          {/* Tabs bar */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-card/60 border border-border/70 shrink-0 mb-2.5">
            <button
              type="button"
              onClick={() => setActiveTab("perspective")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === "perspective"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{t("tabPerspective")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("facts")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === "facts"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{t("tabFacts", { count: facts.length })}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chat")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-[4px] text-xs font-medium transition-all cursor-pointer ${
                activeTab === "chat"
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{t("tabChat")}</span>
            </button>
          </div>

          {/* Tab Panel Body */}
          <div className="flex-1 min-h-0 p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md overflow-y-auto">
            {activeTab === "perspective" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-primary font-semibold text-xs uppercase tracking-wide">
                  <Shield className="w-3.5 h-3.5" />
                  <span>{t("synthesizedTitle")}</span>
                </div>
                <div className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-line opacity-95">
                  {(typeof perspective === "object" && perspective !== null
                    ? (perspective as PerspectiveObject).perspective || (perspective as PerspectiveObject).reasoning
                    : perspective) || t("defaultPerspective")}
                </div>
              </div>
            )}

            {activeTab === "facts" && (
              <div className="space-y-2.5">
                <div className="text-xs font-semibold text-foreground uppercase tracking-wide mb-1">
                  {t("claimsTitle")}
                </div>
                {facts.length > 0 ? (
                  facts.map((fact: string | FactItem, idx: number) => {
                    const claimText =
                      typeof fact === "string"
                        ? fact
                        : fact.claim || fact.original_claim || fact.explanation || "Verified Claim";
                    const verdict = typeof fact === "object" ? fact.verdict : null;
                    const explanation = typeof fact === "object" ? fact.explanation : null;

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl border border-border/60 bg-secondary/40 flex flex-col gap-1.5"
                      >
                        <div className="flex items-start gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
                          <p className="text-xs text-foreground font-medium leading-snug">
                            {claimText}
                          </p>
                        </div>
                        {explanation && explanation !== claimText && (
                          <p className="text-[11px] text-foreground-muted pl-6 leading-relaxed">
                            {verdict && <span className="font-semibold text-primary mr-1.5">[{verdict}]</span>}
                            {explanation}
                          </p>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-foreground-muted opacity-80">{t("claimsVerified")}</p>
                )}
              </div>
            )}

            {activeTab === "chat" && (
              <div className="flex flex-col h-full justify-between">
                <div className="space-y-2 mb-2 flex-1 min-h-0 overflow-y-auto pr-1">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`p-2.5 rounded-xl text-xs ${
                        msg.role === "assistant"
                          ? "bg-secondary/50 text-foreground border border-border/50"
                          : "bg-primary text-primary-foreground ml-6"
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2 shrink-0">
                  <input
                    type="text"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t("chatPlaceholder")}
                    className="flex-1 px-3.5 py-2 rounded-[4px] border border-search-border bg-search-bg/40 text-foreground text-xs sm:text-sm placeholder:text-search-placeholder focus:outline-none focus:ring-2 focus:ring-ring/20 focus:border-ring transition-all"
                  />
                  <button
                    type="submit"
                    disabled={isSending || !message.trim()}
                    className="px-4 py-2 rounded-[4px] bg-primary text-primary-foreground font-medium text-xs shadow hover:opacity-95 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Right Column / Bottom Section (1 Col on lg): Bias Scorecard & Sentiment */}
        <div className="flex flex-col gap-3 shrink-0 justify-between">
          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md flex flex-col items-center text-center">
            <h3 className="text-xs font-semibold text-foreground mb-1">{t("biasIndex")}</h3>
            <div className="scale-85 origin-center">
              <BiasMeter score={typeof biasScore === "number" ? biasScore : 45} />
            </div>
            <p className="text-xs text-foreground-muted opacity-80 mt-1 leading-snug">
              {t("biasDescription")}
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl border border-border/70 bg-card/60 backdrop-blur-md">
            <h4 className="text-xs font-semibold text-foreground mb-2">{t("toneReliability")}</h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground-muted text-xs">{t("framing")}</span>
                <span className="font-semibold text-foreground text-xs capitalize">{sentiment || "Neutral"}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-border/30">
                <span className="text-foreground-muted text-xs">{t("credibilityScore")}</span>
                <span className="font-semibold text-success text-xs">{t("verified", { score })}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-foreground-muted text-xs">{t("modelJudge")}</span>
                <span className="font-semibold text-foreground text-xs">Groq LLaMA 3.3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Footer Note */}
      <div className="shrink-0 text-center text-xs text-foreground-muted opacity-80 pb-1">
        {t("footer")}
      </div>
    </div>
  );
}
