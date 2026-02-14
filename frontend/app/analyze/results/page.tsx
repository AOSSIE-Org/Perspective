"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Globe,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Link,
  Send,
  Sparkles,
  AlertCircle,
  MessageCircle,
  X,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";

export default function ResultsPage() {
  const [activeTab, setActiveTab] = useState("article");
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [biasScore, setBiasScore] = useState<any>(null);
  const [newUrl, setNewUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ role: string; content: string }>>([]);
  const [chatInput, setChatInput] = useState("");
  const [hasError, setHasError] = useState(false);
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  const router = useRouter();
  
  // Track if component is mounted to prevent state updates after unmount
  const isMounted = useRef(true);

  useEffect(() => {
    const storedAnalysis = sessionStorage.getItem("analysisResult");
    const storedBias = sessionStorage.getItem("BiasScore");

    let parsedAnalysis = null;
    let parsedBias = null;

    // Try to parse analysis data
    if (storedAnalysis) {
      try {
        parsedAnalysis = JSON.parse(storedAnalysis);
        setAnalysisData(parsedAnalysis);
        
        // Check if analysis failed
        if ((parsedAnalysis.status === "stopped_due_to_error" || parsedAnalysis.status === "error") && !parsedAnalysis.cleaned_text) {
          setHasError(true);
        }
      } catch (error) {
        console.error("Failed to parse analysis data:", error);
        sessionStorage.removeItem("analysisResult");
        setHasError(true);
      }
    }

    // Try to parse bias score data
    if (storedBias) {
      try {
        parsedBias = JSON.parse(storedBias);
        setBiasScore(parsedBias);
      } catch (error) {
        console.error("Failed to parse bias score:", error);
        sessionStorage.removeItem("BiasScore");
        // Bias is optional, don't set error flag
      }
    }

    // Redirect if no valid analysis data
    if (!storedAnalysis || !parsedAnalysis) {
      console.warn("No valid analysis data found, redirecting to analyze page");
      router.push("/analyze");
      return;
    }

    // Initialize chat messages
    setChatMessages([
      {
        role: "assistant",
        content: "Welcome to the Perspective chat. You can ask me questions about this article or request more information about specific claims.",
      },
    ]);

    // Cleanup function to mark component as unmounted
    return () => {
      isMounted.current = false;
    };
  }, [router]);

  const validateUrl = (inputUrl: string) => {
    try {
      const parsedUrl = new URL(inputUrl);
      
      // Whitelist only safe protocols to prevent XSS attacks
      // Reject javascript:, data:, file:, and other dangerous protocols
      const safeProtocols = ['http:', 'https:'];
      
      if (safeProtocols.includes(parsedUrl.protocol)) {
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
    setNewUrl(inputUrl);
    if (inputUrl.length > 0) {
      validateUrl(inputUrl);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleAnalyzeNew = () => {
    if (isValidUrl && newUrl) {
      sessionStorage.setItem("articleUrl", newUrl);
      router.push("/analyze/loading");
    }
  };

  const handleSendMessage = () => {
    if (chatInput.trim()) {
      setChatMessages([...chatMessages, { role: "user", content: chatInput }]);
      
      // Store timeout ID for potential cleanup
      const timeoutId = setTimeout(() => {
        // Check if component is still mounted before updating state
        if (isMounted.current) {
          setChatMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: "This is a simulated response. In production, this would connect to your AI backend.",
            },
          ]);
        }
      }, 1000);
      
      setChatInput("");
      
      // Note: If you need to clear this specific timeout on unmount,
      // you'd need to store it in a ref and clear it in useEffect cleanup
    }
  };

  const getBiasLevel = (score: number) => {
    if (score < 30) return { label: "Low Bias", color: "text-emerald-500", bgColor: "bg-emerald-500" };
    if (score < 70) return { label: "Moderate Bias", color: "text-yellow-500", bgColor: "bg-yellow-500" };
    return { label: "High Bias", color: "text-red-500", bgColor: "bg-red-500" };
  };

  const biasLevel = biasScore?.bias_score !== undefined ? getBiasLevel(biasScore.bias_score) : null;

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 transition-colors duration-300 overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 dark:from-emerald-400/5 dark:to-cyan-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Fixed Header */}
      <header className="flex-shrink-0 border-b border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl z-50">
        <div className="container mx-auto px-4 lg:px-6 py-3 flex items-center justify-between max-w-7xl">
          <div
            className="flex items-center space-x-2.5 group cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Globe className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perspective
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area - Flex container */}
      <main className="flex-1 container mx-auto px-4 lg:px-6 py-3 relative z-10 max-w-7xl overflow-hidden">
        <div className={`h-full flex gap-3 transition-all duration-300 ${isChatCollapsed ? 'justify-center' : ''}`}>
          
          {/* Left Column - Results (constrained max-width) */}
          <div className={`flex flex-col gap-3 overflow-hidden transition-all duration-300 ${
            isChatCollapsed ? 'w-full max-w-4xl' : 'flex-1'
          }`}>
            
            {/* Scrollable Results Area with fade effect */}
            <div className="flex-1 overflow-hidden relative">
              <div className="h-full overflow-y-auto space-y-3 pr-2 pb-4">
                {/* Error Message */}
                {hasError && (
                  <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-base font-semibold text-red-900 dark:text-red-100 mb-2">
                          Analysis Failed
                        </h3>
                        <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                          We couldn't process this article. This could be due to:
                        </p>
                        <ul className="text-sm text-red-800 dark:text-red-200 space-y-1 mb-3 list-disc list-inside">
                          <li>The URL may be inaccessible or behind a paywall</li>
                          <li>The content couldn't be extracted properly</li>
                          <li>The article format isn't supported</li>
                          <li>Backend service timeout or error</li>
                          <li>Corrupted or invalid session data</li>
                        </ul>
                        <Button
                          onClick={() => router.push("/analyze")}
                          className="bg-red-600 hover:bg-red-700 text-white border-0 h-9 px-4 text-sm"
                        >
                          Try Another Article
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Title, Sentiment & Bias Score */}
                {!hasError && (
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-4 shadow-lg">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1">
                        <Badge className="mb-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-3 py-1 text-xs font-medium shadow-lg inline-flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          Analysis Complete
                        </Badge>
                        <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100 mb-3">
                          Analysis Results
                        </h1>
                        
                        {/* Sentiment */}
                        <div className="space-y-1">
                          <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Sentiment:
                          </p>
                          <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            {analysisData?.sentiment || "Analyzing..."}
                          </p>
                        </div>
                      </div>

                      {/* Compact Bias Score */}
                      {biasLevel && biasScore?.bias_score !== undefined && (
                        <div className="flex flex-col items-center bg-gradient-to-br from-slate-100 to-blue-100/50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-3 min-w-[100px]">
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                            Bias Score
                          </p>
                          <div className="relative w-14 h-14 mb-1">
                            <svg className="w-14 h-14 transform -rotate-90">
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                className="text-slate-200 dark:text-slate-700"
                              />
                              <circle
                                cx="28"
                                cy="28"
                                r="24"
                                stroke="currentColor"
                                strokeWidth="5"
                                fill="none"
                                strokeDasharray={`${2 * Math.PI * 24}`}
                                strokeDashoffset={`${2 * Math.PI * 24 * (1 - biasScore.bias_score / 100)}`}
                                className={biasLevel.color}
                                strokeLinecap="round"
                              />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className={`text-lg font-bold ${biasLevel.color}`}>
                                {biasScore.bias_score}
                              </span>
                            </div>
                          </div>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 mb-0.5">
                            {biasScore.bias_score}/100
                          </p>
                          <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 text-center">
                            {biasLevel.label}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Bias Score Label */}
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        Bias Score:
                      </p>
                    </div>
                  </div>
                )}

                {/* Content Tabs */}
                {!hasError && (
                  <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden">
                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      {["article", "perspective", "factcheck"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          className={`flex-1 px-3 py-2.5 text-xs font-medium capitalize transition-colors ${
                            activeTab === tab
                              ? "text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-white dark:bg-slate-800"
                              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          }`}
                        >
                          {tab === "factcheck" ? "Fact Check" : tab}
                        </button>
                      ))}
                    </div>

                    {/* Tab Content */}
                    <div className="p-4">
                      {activeTab === "article" && (
                        <div className="prose dark:prose-invert max-w-none">
                          {analysisData?.cleaned_text ? (
                            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap">
                              {analysisData.cleaned_text}
                            </p>
                          ) : (
                            <p className="text-slate-500 dark:text-slate-400 text-center py-6 text-sm">
                              No article content available
                            </p>
                          )}
                        </div>
                      )}

                      {activeTab === "perspective" && (
                        <div className="space-y-3">
                          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                            <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 text-xs">
                              Alternative Perspective
                            </h4>
                            {analysisData?.alternative_perspective ? (
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {analysisData.alternative_perspective}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Alternative perspectives will appear here once analysis is complete.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === "factcheck" && (
                        <div className="space-y-3">
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                            <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2 text-xs flex items-center gap-2">
                              <CheckCircle className="w-3 h-3" />
                              Fact Check Results
                            </h4>
                            {analysisData?.fact_check ? (
                              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                                {analysisData.fact_check}
                              </p>
                            ) : (
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                Fact-checking results will appear here once analysis is complete.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Bottom fade effect */}
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent dark:from-slate-900 dark:via-slate-900/80 dark:to-transparent pointer-events-none"></div>
            </div>

            {/* Fixed Analyze Another Article Box */}
            <div className="flex-shrink-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 p-3 shadow-lg">
              <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Analyze Another Article
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="flex-1 relative">
                  <Link className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={newUrl}
                    onChange={handleUrlChange}
                    className="pl-9 h-9 text-sm border border-slate-200 dark:border-slate-700 focus-visible:border-slate-300 dark:focus-visible:border-slate-600 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors"
                  />
                  {newUrl && (
                    <div className="absolute right-2.5 top-1/2 transform -translate-y-1/2">
                      {isValidUrl ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-red-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAnalyzeNew}
                  disabled={!isValidUrl || !newUrl}
                  className="h-9 px-5 text-sm bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 transition-all duration-300 shadow-lg group border-0 text-white whitespace-nowrap"
                >
                  Analyze
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column - Collapsible AI Discussion */}
          <div className={`flex-shrink-0 w-full max-w-sm flex flex-col overflow-hidden transition-all duration-300 ${isChatCollapsed ? 'hidden' : ''}`}>
            <div className="h-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-lg overflow-hidden flex flex-col relative">
              {/* Collapse Button */}
              <button
                onClick={() => setIsChatCollapsed(!isChatCollapsed)}
                className="absolute top-3 right-3 z-10 w-6 h-6 flex items-center justify-center bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-full transition-colors"
                title="Collapse chat"
              >
                <X className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>

              {/* Chat Header */}
              <div className="flex-shrink-0 p-3 pr-12 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-900/50 dark:to-slate-800/50">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  AI Discussion
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  Ask questions about this article
                </p>
              </div>

              {/* Chat Messages - Scrollable */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                        msg.role === "user"
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input - Fixed at bottom */}
              <div className="flex-shrink-0 p-2.5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Ask a question..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    className="flex-1 h-9 text-xs border border-slate-300 dark:border-slate-600 focus-visible:border-slate-400 dark:focus-visible:border-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0"
                    disabled={hasError}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || hasError}
                    className="h-9 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 border-0 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Floating Chat Button (when collapsed) */}
      {isChatCollapsed && (
        <button
          onClick={() => setIsChatCollapsed(false)}
          className="fixed right-6 bottom-6 w-14 h-14 flex items-center justify-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 z-50 group"
          title="Open AI Discussion"
        >
          <MessageCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>
        </button>
      )}
    </div>
  );
}
