"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  Sparkles,
  MessageSquarePlus,
  ChevronLeft,
  ChevronRight,
  Send,
  Menu,
  X,
  ChevronDown,
  Check,
  Bot,
  User,
  Loader2,
} from "lucide-react";

import { usePerspective } from "@/hooks/use-perspective";
import { useChat } from "@/hooks/use-chat";
import { RightSidebar } from "@/components/perspective/RightSidebar";

const PROVIDERS = [
  { id: "groq", name: "Groq" },
  { id: "gemini", name: "Gemini" },
];

export default function PerspectivePage() {
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    analysisData,
    loading,
    biasScore,
    scoreConfig,
    provider,
    setProvider,
  } = usePerspective();

  const threadId = analysisData?.thread_id;
  const { messages, sendMessage, sending } = useChat(threadId);

  const [chatInput, setChatInput] = useState("");
  const [providerOpen, setProviderOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const title =
    analysisData?.perspective?.short_title || "Analyzing Article...";
  const perspectiveText =
    analysisData?.perspective?.perspective ||
    "Please wait while our AI agents analyze the content, check facts, and determine the perspective...";
  const summary = analysisData?.article_summary;

  const handleSend = () => {
    if (!chatInput.trim() || sending) return;
    sendMessage(chatInput, provider);
    setChatInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const currentProvider = PROVIDERS.find((p) => p.id === provider) || PROVIDERS[0];

  return (
    <div className="h-[100dvh] bg-background-dark text-white font-sora flex overflow-hidden">
      {/* ---- Mobile Header ---- */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background-dark border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl tracking-tight text-white">
          perspective
        </Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* ---- Left Sidebar ---- */}
      <aside
        className={`hidden lg:flex flex-col border-r border-white/10 transition-all duration-300 flex-shrink-0 ${
          leftSidebarOpen ? "w-[280px] p-6" : "w-[80px] p-4 items-center"
        }`}
      >
        <div className="mb-8 w-full flex items-center justify-between">
          {leftSidebarOpen && (
            <Link href="/" className="font-semibold text-2xl tracking-tight text-white whitespace-nowrap">
              perspective
            </Link>
          )}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5"
          >
            {leftSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>

        <Link
          href="/"
          className={`flex items-center gap-2 bg-[#193DB8] text-white rounded-[8px] font-medium transition-colors hover:bg-[#193DB8]/90 mb-auto ${
            leftSidebarOpen ? "px-4 py-3 w-full" : "p-3 justify-center aspect-square"
          }`}
        >
          <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
          {leftSidebarOpen && <span className="whitespace-nowrap">New Article</span>}
        </Link>

        <div className="mt-auto w-full">
          <button
            className={`flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-white/5 ${
              !leftSidebarOpen && "justify-center"
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {leftSidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-14 lg:pt-0 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 max-w-4xl mx-auto w-full scroll-smooth hide-scrollbar">
          {/* Title */}
          <div className="mb-6">
            {loading.process ? (
              <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold leading-tight font-sora">
                {title}
              </h1>
            )}
          </div>

          {/* Article Summary */}
          {summary && !loading.process && (
            <div className="mb-6 p-5 rounded-xl bg-white/[0.03] border border-white/5">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Article Summary
              </h3>
              <p className="text-gray-300 text-[15px] leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Perspective Analysis */}
          <div className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/5 mb-6">
            <Sparkles
              className={`w-6 h-6 text-blue-400 mt-1 flex-shrink-0 ${loading.process ? "animate-spin" : ""}`}
            />
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 font-sora">
                Perspective Analysis
              </h3>
              <div className="text-gray-300 space-y-4 leading-relaxed text-[15px] font-sora">
                <p>{perspectiveText}</p>
              </div>
            </div>
          </div>

          {/* Web Search Citations (inline) */}
          {analysisData?.web_search_citations &&
            analysisData.web_search_citations.length > 0 && (
              <div className="mb-6 p-5 rounded-xl bg-white/[0.03] border border-white/5">
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                  Sources Used
                </h3>
                <ul className="space-y-2">
                  {analysisData.web_search_citations.map((c, i) => (
                    <li key={i} className="text-sm">
                      <a
                        href={c.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline font-medium"
                      >
                        {c.title || c.url}
                      </a>
                      {c.snippet && (
                        <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">
                          {c.snippet}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Chat Messages */}
          {messages.length > 0 && (
            <div className="space-y-4 mt-4 max-h-[50vh] overflow-y-auto hide-scrollbar">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                Conversation
              </h3>
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-blue-400" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-blue-600/30 text-white rounded-br-sm"
                        : "bg-white/5 text-gray-300 border border-white/5 rounded-bl-sm"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  </div>
                  {msg.role === "user" && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-gray-400" />
                    </div>
                  )}
                </div>
              ))}

              {sending && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="bg-white/5 border border-white/5 rounded-xl rounded-bl-sm px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* ---- Input Area ---- */}
        <div className="p-4 md:p-6 border-t border-white/10 bg-background-dark z-10">
          <div className="max-w-4xl mx-auto relative flex items-center gap-2">
            {/* Provider Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setProviderOpen(!providerOpen)}
                className="flex items-center gap-1.5 text-white/70 text-sm hover:text-white transition-colors bg-white/5 border border-white/10 rounded-lg px-3 py-3 whitespace-nowrap"
              >
                <span className="font-medium">{currentProvider.name}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${providerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {providerOpen && (
                <div className="absolute bottom-full left-0 mb-2 bg-[#1B1F24] border border-white/10 rounded-lg shadow-xl z-50 overflow-hidden min-w-[120px]">
                  {PROVIDERS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProvider(p.id);
                        sessionStorage.setItem("selectedProvider", p.id);
                        setProviderOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-white/10 transition-colors flex items-center justify-between ${
                        provider === p.id ? "text-blue-400" : "text-white/80"
                      }`}
                    >
                      {p.name}
                      {provider === p.id && <Check className="w-3 h-3" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Input */}
            <div className="relative flex-1">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={!threadId || loading.process}
                placeholder={
                  loading.process
                    ? "Waiting for analysis to complete..."
                    : !threadId
                      ? "Analysis required before chatting..."
                      : "Ask questions about this article..."
                }
                className="w-full bg-[#1B1F24] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 font-sora transition-all shadow-sm disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!chatInput.trim() || sending || !threadId}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ---- Right Sidebar ---- */}
      <RightSidebar
        isOpen={rightSidebarOpen}
        onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
        loading={loading.bias}
        biasScore={biasScore}
        scoreConfig={scoreConfig}
        summary={analysisData?.article_summary}
        facts={analysisData?.facts}
        citations={analysisData?.web_search_citations}
      />
    </div>
  );
}