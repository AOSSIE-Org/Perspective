"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "axios";
import MultiPerspectivePanel from "./MultiPerspectivePanel";

export interface AnalysisData {
  cleaned_text?: string;
  facts?: Array<{ claim: string }>;
  sentiment?: "positive" | "negative" | "neutral" | string;
  perspective?: {
    reasoning: string;
    themes: string[];
    [key: string]: any;
  };
  [key: string]: any;
}

export default function AnalyzeResultsPage() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [biasScore, setBiasScore] = useState<number | null>(null);
  const [articleUrl, setArticleUrl] = useState<string>("");
  const router = useRouter();
  const isRedirecting = useRef(false);
  const [activeTab, setActiveTab] = useState("article");
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "system",
      content:
        "Welcome to the Perspective chat. You can ask me questions about this article or request more information about specific claims.",
    },
  ]);

  // Custom Cursor state
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

  useEffect(() => {
    if (isRedirecting.current) {
      return;
    }

    try {
      const storedData = sessionStorage.getItem("analysisResult");
      const storedBiasScore = sessionStorage.getItem("BiasScore");

      if (storedBiasScore && storedData) {
        const biasData = JSON.parse(storedBiasScore);
        setBiasScore(biasData.bias_score);
        const analysis = JSON.parse(storedData);
        // Merge bias dimensions and summary into analysisData for UI
        if (biasData.dimensions) analysis.bias_dimensions = biasData.dimensions;
        if (biasData.summary) analysis.bias_summary = biasData.summary;
        setAnalysisData(analysis);
        setArticleUrl(sessionStorage.getItem("articleUrl") || "");
        setIsLoading(false);
      } else {
        console.warn("No bias or data found. Redirecting...");
        if (!isRedirecting.current) {
          isRedirecting.current = true;
          router.push("/analyze");
        }
      }
    } catch (error) {
      console.error("Malformed session data encountered: ", error);
      sessionStorage.removeItem("analysisResult");
      sessionStorage.removeItem("BiasScore");
      if (!isRedirecting.current) {
        isRedirecting.current = true;
        router.push("/analyze");
      }
    }
  }, [router]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    setIsSending(true);
    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setMessage("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await axios.post(`${API_URL}/api/chat`, {
        message: message,
      });
      const data = res.data;
      setMessages([...newMessages, { role: "assistant", content: data.answer }]);
    } catch (e) {
      console.error(e);
      setMessages([...newMessages, { role: "assistant", content: "Error contacting the server." }]);
    } finally {
      setIsSending(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background-dark font-display text-slate-100">
        <div className="w-8 h-8 rounded-full border border-primary flex items-center justify-center bg-primary/20 shadow-[0_0_15px_rgba(6,224,249,0.4)] animate-pulse">
          <span className="material-symbols-outlined text-primary text-lg">settings_suggest</span>
        </div>
      </div>
    );
  }
  const {
    cleaned_text = "",
    facts = [],
    sentiment = "neutral",
    perspective,
  } = (analysisData || {}) as AnalysisData;

  let biasLabel = "BALANCED DETECTED";
  let biasColorClass = "text-primary";

  if (biasScore !== null) {
    if (biasScore > 66) {
      biasLabel = "HIGH-BIAS DETECTED";
      biasColorClass = "text-red-500";
    } else if (biasScore > 33) {
      biasLabel = "MODERATE-BIAS DETECTED";
      biasColorClass = "text-yellow-500";
    }
  }

  return (
    <div className="bg-background-dark font-display text-slate-100 min-h-screen selection:bg-primary/30 flex flex-col grid-pattern">
      {/* Custom Cursor */}
      <div className="custom-cursor hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y }}></div>
      <div className="custom-cursor-ring hidden md:block" style={{ left: ringPos.x, top: ringPos.y }}></div>

      <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden pb-10 z-10">
        {/* Top Navbar */}
        <nav className="flex items-center bg-background-dark/80 backdrop-blur-md border-b border-primary/10 p-4 sticky top-0 z-50 justify-between">
          <div className="flex items-center gap-2 cursor-none" onClick={() => router.push("/")}>
            <span className="material-symbols-outlined text-primary">lens_blur</span>
            <h2 className="text-slate-100 text-lg font-bold leading-tight tracking-tight uppercase">Perspective-AI</h2>
          </div>
        </nav>

        <main className="flex-1 w-full max-w-6xl mx-auto p-4 md:p-8 pt-6">
          <div className="flex flex-col gap-1 mb-6">
            <h1 className="font-serif text-4xl font-bold text-slate-100 tracking-tight">Analysis Result</h1>
            <div className="flex items-center mt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 shadow-[0_0_15px_rgba(6,224,249,0.2)]">
                <span className="material-symbols-outlined text-primary text-sm line-clamp-1">{sentiment === 'positive' ? 'trending_up' : sentiment === 'negative' ? 'trending_down' : 'horizontal_rule'}</span>
                <p className="text-primary text-xs font-bold uppercase tracking-widest">Sentiment: {sentiment}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">

            {/* Left Column (Data + Gauge) */}
            <div className="lg:col-span-7 flex flex-col gap-6">

              {/* Bias Meter Gauge */}
              <div className="glass-card rounded-xl p-6 flex flex-col items-center justify-center relative overflow-hidden bg-white/5 border border-white/10">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <span className="material-symbols-outlined text-6xl text-primary">network_node</span>
                </div>
                {/* Semi-circular gauge visual */}
                <div className="relative w-48 h-28 mt-4 mb-2">
                  <svg viewBox="0 0 100 55" className="w-full h-full overflow-visible drop-shadow-lg">
                    {/* Background Arc */}
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className="text-slate-800"
                    />
                    {/* Value Arc */}
                    <path
                      d="M 10 50 A 40 40 0 0 1 90 50"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="10"
                      strokeLinecap="round"
                      className={`${biasColorClass} transition-all duration-1000 ease-out`}
                      style={{
                        strokeDasharray: 125.66,
                        strokeDashoffset: 125.66 - (125.66 * (biasScore ?? 0)) / 100,
                        filter: biasScore && biasScore > 33 ? `drop-shadow(0 0 8px currentColor)` : 'none'
                      }}
                    />
                  </svg>
                  <div className="absolute bottom-0 left-0 w-full flex items-baseline justify-center pb-0">
                    <span className="text-5xl font-bold text-slate-100 font-mono tracking-tighter leading-none">{biasScore ?? 0}</span>
                    <span className="text-slate-500 text-sm font-normal ml-1">/100</span>
                  </div>
                </div>

                <div className="text-center mt-6 mb-4">
                  <p className="text-slate-400 text-xs uppercase tracking-widest mb-1">Composite Bias Score</p>
                  <p className={`${biasColorClass} text-lg font-bold font-mono tracking-wider`}>{biasLabel}</p>
                  {(analysisData as any)?.bias_summary && (
                    <p className="text-slate-500 text-[10px] font-mono mt-2 max-w-xs mx-auto leading-relaxed italic">
                      {(analysisData as any).bias_summary}
                    </p>
                  )}
                </div>

                {/* Dimension Breakdown */}
                {(analysisData as any)?.bias_dimensions && (
                  <div className="w-full space-y-2 border-t border-white/5 pt-4">
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-3">Bias Dimensions</p>
                    {Object.entries((analysisData as any).bias_dimensions).map(([key, val]: [string, any]) => {
                      const pct = Math.min(Math.max(Number(val) || 0, 0), 100);
                      const barColor = pct > 66 ? "bg-red-500" : pct > 33 ? "bg-yellow-500" : "bg-primary";
                      const label = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());
                      return (
                        <div key={key} className="flex items-center gap-2">
                          <p className="text-[9px] text-slate-500 font-mono w-28 shrink-0">{label}</p>
                          <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${pct}%` }} />
                          </div>
                          <p className="text-[9px] text-slate-400 font-mono w-6 text-right">{pct}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>


              {/* Analysis Tabs Content */}
              <div className="glass-card rounded-xl overflow-hidden flex flex-col h-full bg-white/5 border border-white/10 min-h-[400px]">
                <div className="flex border-b border-white/10">
                  <button
                    onClick={() => setActiveTab('article')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'article' ? 'text-primary border-primary bg-primary/5' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                    Article
                  </button>
                  <button
                    onClick={() => setActiveTab('perspective')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'perspective' ? 'text-primary border-primary bg-primary/5' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                    Perspective
                  </button>
                  <button
                    onClick={() => setActiveTab('factcheck')}
                    className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors border-b-2 ${activeTab === 'factcheck' ? 'text-primary border-primary bg-primary/5' : 'text-slate-400 border-transparent hover:text-slate-200'}`}>
                    Fact Check
                  </button>
                </div>

                <div className="p-6 flex flex-col gap-6 overflow-y-auto max-h-[600px] flex-1">

                  {activeTab === 'article' && (
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest flex items-center gap-2 font-mono">
                        <span className="material-symbols-outlined text-sm">subject</span>
                        Source Text
                      </h3>
                      <div className="font-mono text-sm text-slate-300 leading-relaxed space-y-4">
                        {cleaned_text.split("\n\n").map((para: string, idx: number) => (
                          <p key={idx}>{para}</p>
                        ))}
                      </div>
                    </section>
                  )}

                  {activeTab === 'perspective' && (
                    <>
                      {perspective ? (
                        <>
                          <section>
                            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                              <span className="material-symbols-outlined text-sm">visibility_off</span>
                              Counter-Perspective
                            </h3>
                            <p className="font-serif italic text-lg md:text-xl text-slate-200 leading-relaxed border-l-2 border-primary/30 pl-4 py-2">
                              "{perspective.perspective}"
                            </p>
                          </section>
                          <div className="h-px bg-white/5"></div>
                          <section>
                            <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                              <span className="material-symbols-outlined text-sm">psychology</span>
                              Reasoning
                            </h3>
                            <div className="font-mono text-sm text-slate-400 leading-relaxed bg-black/20 p-4 rounded-lg">
                              <p>{perspective.reasoning}</p>
                            </div>
                          </section>
                        </>
                      ) : (
                        <div className="text-slate-500 font-mono text-sm text-center py-10 uppercase tracking-widest">
                          No counter-perspective generated.
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'factcheck' && (
                    <section className="space-y-4">
                      <h3 className="text-xs font-bold text-primary/60 uppercase tracking-widest mb-3 flex items-center gap-2 font-mono">
                        <span className="material-symbols-outlined text-sm">verified</span>
                        Claim Verification
                      </h3>
                      <div className="space-y-4">
                        {facts.length > 0 ? (
                          facts.map((fact: any, idx: number) => {
                            const isTrue = fact.verdict === "True";
                            const isFalse = fact.verdict === "False";
                            const color = isTrue ? "text-green-400" : isFalse ? "text-red-400" : "text-yellow-400";
                            const bg = isTrue ? "bg-green-400/10 border-green-400/20" : isFalse ? "bg-red-400/10 border-red-400/20" : "bg-yellow-400/10 border-yellow-400/20";

                            return (
                              <div key={idx} className="bg-black/20 border border-white/5 rounded-lg p-4 space-y-3">
                                <div className="flex justify-between items-start gap-4">
                                  <h4 className="font-serif text-slate-200 leading-tight flex-1">{fact.original_claim}</h4>
                                  <span className={`text-[10px] font-mono font-bold uppercase tracking-widest px-2 py-1 rounded border ${bg} ${color} whitespace-nowrap`}>
                                    {fact.verdict}
                                  </span>
                                </div>
                                <p className="font-mono text-xs text-slate-400 leading-relaxed">{fact.explanation}</p>
                                {fact.source_link && (
                                  <Link
                                    href={fact.source_link}
                                    target="_blank"
                                    className="inline-flex items-center text-xs text-primary/60 hover:text-primary transition-colors font-mono uppercase tracking-widest mt-2"
                                  >
                                    <span className="material-symbols-outlined text-xs mr-1 text-primary">link</span> Source
                                  </Link>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-slate-500 font-mono text-sm text-center py-10 uppercase tracking-widest">
                            No explicit claims identified.
                          </div>
                        )}
                      </div>
                    </section>
                  )}


                </div>
              </div>

            </div>


            {/* Right Column (AI Chat) */}
            <div className="lg:col-span-5 flex flex-col h-full min-h-[600px]">
              <div className="glass-card rounded-xl flex flex-col h-full bg-white/5 border border-white/10 flex-1">
                <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black/20 rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <div className="size-2 bg-primary rounded-full animate-pulse shadow-[0_0_8px_#06e0f9]"></div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-slate-200">AI Discussion</h3>
                  </div>
                  <span className="material-symbols-outlined text-slate-400 text-sm">forum</span>
                </div>

                <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                  {messages.map((msg, i) => {
                    const isUser = msg.role === 'user';
                    const isSystem = msg.role === 'system';

                    return (
                      <div key={i} className={`flex gap-3 max-w-[90%] ${isUser ? 'ml-auto flex-row-reverse' : ''}`}>

                        {!isUser && (
                          <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${isSystem ? 'bg-primary/20 border border-primary/30' : 'bg-purple-500/20 border border-purple-500/30'}`}>
                            <span className={`material-symbols-outlined text-sm ${isSystem ? 'text-primary' : 'text-purple-400'}`}>smart_toy</span>
                          </div>
                        )}

                        <div className={`rounded-2xl p-3 border text-sm leading-relaxed ${isUser
                          ? 'bg-primary/20 border-primary/30 text-white rounded-tr-none'
                          : isSystem
                            ? 'bg-white/5 border-white/5 text-slate-300 rounded-tl-none'
                            : 'bg-purple-500/10 border-purple-500/20 text-slate-200 rounded-tl-none font-mono text-xs'
                          }`}>
                          <p>{msg.content}</p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 pt-0 mt-auto">
                  <form onSubmit={handleSendMessage} className="relative mt-4 flex items-center">
                    <label htmlFor="chat-input" className="sr-only">Ask a question</label>
                    <span className="material-symbols-outlined absolute left-4 text-slate-500 text-sm">terminal</span>
                    <input
                      id="chat-input"
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Query pipeline parameters..."
                      disabled={isSending}
                      className="w-full bg-black/40 border border-white/10 rounded-lg py-4 pl-12 pr-14 text-sm font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/40 transition-colors disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !message.trim()}
                      className="absolute right-4 text-accent hover:text-white transition-colors disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>

          </div>

          {/* Multi-Perspective Section */}
          {articleUrl && (
            <MultiPerspectivePanel articleUrl={articleUrl} />
          )}
        </main>
      </div>

      {/* Basic Particle Mesh Layer */}
      <div className="fixed inset-0 pointer-events-none particle-mesh opacity-30 dark:opacity-40 z-0 mix-blend-screen"></div>

    </div>
  );
}
