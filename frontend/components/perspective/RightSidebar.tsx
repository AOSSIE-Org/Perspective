import React, { useState } from "react";
import {
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Loader2,
  ExternalLink,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from "lucide-react";
import { BiasGauge } from "./BiasGauge";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface Fact {
  claim?: string;
  status?: string;
  reason?: string;
}

interface Citation {
  title?: string;
  url?: string;
  snippet?: string;
}

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  loading: boolean;
  biasScore: number;
  scoreConfig: { text: string; gradient: string[]; label: string };
  summary?: string;
  facts?: Fact[];
  citations?: Citation[];
}

/* ------------------------------------------------------------------ */
/*  Sidebar                                                            */
/* ------------------------------------------------------------------ */

export function RightSidebar({
  isOpen,
  onToggle,
  loading,
  biasScore,
  scoreConfig,
  summary,
  facts,
  citations,
}: RightSidebarProps) {
  const [sections, setSections] = useState({
    bias: true,
    summary: false,
    facts: false,
    citations: false,
  });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const factStatusIcon = (status?: string) => {
    const s = (status || "").toLowerCase();
    if (s === "true") return <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />;
    if (s === "false") return <XCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
    return <HelpCircle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />;
  };

  return (
    <aside
      className={`hidden lg:flex flex-col border-l border-white/10 bg-[#15191E] transition-all duration-300 overflow-hidden flex-shrink-0 ${
        isOpen ? "w-[350px]" : "w-[60px]"
      }`}
    >
      <div className="p-4 flex flex-col h-full overflow-y-auto custom-scrollbar">
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5 mb-4 self-start"
        >
          {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>

        {isOpen && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            {/* ── Bias Score ── */}
            <div className="border-b border-white/10 pb-6">
              <button
                onClick={() => toggleSection("bias")}
                className="w-full flex items-center justify-between mb-4 hover:text-gray-200 transition-colors"
              >
                <h3 className="font-semibold text-white font-sora">Bias Score</h3>
                <ChevronDown
                  className={`w-4 h-4 text-gray-400 transition-transform ${sections.bias ? "rotate-180" : ""}`}
                />
              </button>

              {sections.bias &&
                (loading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-500">Detecting Bias...</span>
                  </div>
                ) : (
                  <BiasGauge
                    score={biasScore}
                    gradientColors={scoreConfig.gradient}
                    textColor={scoreConfig.text}
                    label={scoreConfig.label}
                  />
                ))}
            </div>

            {/* ── Accordion sections ── */}
            <div className="flex flex-col gap-3">
              {/* Summary */}
              <AccordionItem
                title="Article Summary"
                isOpen={sections.summary}
                onToggle={() => toggleSection("summary")}
              >
                {summary || "No summary available yet."}
              </AccordionItem>

              {/* Facts */}
              <AccordionItem
                title={`Fact Check${facts?.length ? ` (${facts.length})` : ""}`}
                isOpen={sections.facts}
                onToggle={() => toggleSection("facts")}
              >
                {facts && facts.length > 0 ? (
                  <ul className="space-y-3">
                    {facts.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs">
                        {factStatusIcon(f.status)}
                        <div>
                          <p className="text-gray-300 font-medium">{f.claim}</p>
                          {f.reason && (
                            <p className="text-gray-500 mt-0.5">{f.reason}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No fact-check results yet."
                )}
              </AccordionItem>

              {/* Citations */}
              <AccordionItem
                title={`Citations${citations?.length ? ` (${citations.length})` : ""}`}
                isOpen={sections.citations}
                onToggle={() => toggleSection("citations")}
              >
                {citations && citations.length > 0 ? (
                  <ul className="space-y-2">
                    {citations.map((c, i) => (
                      <li key={i}>
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline text-xs font-medium flex items-center gap-1"
                        >
                          {c.title || c.url}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                        {c.snippet && (
                          <p className="text-gray-500 text-[11px] mt-0.5 line-clamp-2">
                            {c.snippet}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  "No citations available."
                )}
              </AccordionItem>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

/* ------------------------------------------------------------------ */
/*  Reusable accordion item                                            */
/* ------------------------------------------------------------------ */

function AccordionItem({
  title,
  isOpen,
  onToggle,
  children,
}: {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left"
      >
        <h3 className="font-semibold text-white text-sm font-sora">{title}</h3>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="p-3 pt-0 text-sm text-gray-400 border-t border-white/5 mt-2">
          {children}
        </div>
      )}
    </div>
  );
}