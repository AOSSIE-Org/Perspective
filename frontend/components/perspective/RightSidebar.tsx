import React, { useState } from "react";
import { ChevronRight, ChevronLeft, ChevronDown, Loader2 } from "lucide-react";
import { BiasGauge } from "./BiasGauge";

interface RightSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  loading: boolean;
  biasScore: number;
  scoreConfig: { text: string; gradient: string[]; label: string };
  summary?: string;
}

export function RightSidebar({ isOpen, onToggle, loading, biasScore, scoreConfig, summary }: RightSidebarProps) {
  const [sections, setSections] = useState({ bias: true, summary: false, citations: false, graph: false });

  const toggleSection = (key: keyof typeof sections) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
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
            {/* Bias Section */}
            <div className="border-b border-white/10 pb-6">
              <button onClick={() => toggleSection("bias")} className="w-full flex items-center justify-between mb-4 hover:text-gray-200 transition-colors">
                <h3 className="font-semibold text-white font-sora">Bias Score</h3>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${sections.bias ? "rotate-180" : ""}`} />
              </button>

              {sections.bias && (
                loading ? (
                  <div className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                    <span className="text-xs text-gray-500">Detecting Bias...</span>
                  </div>
                ) : (
                  <BiasGauge score={biasScore} gradientColors={scoreConfig.gradient} textColor={scoreConfig.text} label={scoreConfig.label} />
                )
              )}
            </div>

            {/* Accordions */}
            <div className="flex flex-col gap-3">
              <AccordionItem 
                title="Article Summary" 
                isOpen={sections.summary} 
                onToggle={() => toggleSection("summary")}
              >
                {summary || "No summary available."}
              </AccordionItem>
              
              <AccordionItem 
                title="Citations" 
                isOpen={sections.citations} 
                onToggle={() => toggleSection("citations")}
              >
                No citations found.
              </AccordionItem>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function AccordionItem({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="border border-white/5 bg-white/[0.02] rounded-lg overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-white/5 transition-colors text-left">
        <h3 className="font-semibold text-white text-sm font-sora">{title}</h3>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>
      {isOpen && <div className="p-3 pt-0 text-sm text-gray-400 border-t border-white/5 mt-2">{children}</div>}
    </div>
  );
}