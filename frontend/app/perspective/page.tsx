"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Settings, 
  Sparkles, 
  MessageSquarePlus, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  Menu, 
  X 
} from "lucide-react";

import { usePerspective } from "@/hooks/use-perspective";
import { RightSidebar } from "@/components/perspective/RightSideBar";

export default function PerspectivePage() {
  // 1. Layout State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 2. Logic Hook
  const { analysisData, loading, biasScore, scoreConfig } = usePerspective();

  // 3. Derived Content
  const title = analysisData?.perspective?.short_title || "Analyzing Article...";
  const perspectiveText = analysisData?.perspective?.perspective || 
    "Please wait while our AI agents analyze the content, check facts, and determine the perspective...";

  return (
    <div className="h-[100dvh] bg-background-dark text-white font-sora flex overflow-hidden">
      
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background-dark border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <Link href="/" className="font-semibold text-xl tracking-tight text-white">perspective</Link>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-white">
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay would go here (omitted for brevity, can also be a component) */}

      {/* Left Sidebar */}
      <aside className={`hidden lg:flex flex-col border-r border-white/10 transition-all duration-300 flex-shrink-0 ${
        leftSidebarOpen ? "w-[280px] p-6" : "w-[80px] p-4 items-center"
      }`}>
        <div className="mb-8 w-full flex items-center justify-between">
          {leftSidebarOpen && <Link href="/" className="font-semibold text-2xl tracking-tight text-white whitespace-nowrap">perspective</Link>}
          <button onClick={() => setLeftSidebarOpen(!leftSidebarOpen)} className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-white/5">
            {leftSidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        
        <button className={`flex items-center gap-2 bg-[#193DB8] text-white rounded-[8px] font-medium transition-colors hover:bg-[#193DB8]/90 mb-auto ${leftSidebarOpen ? "px-4 py-3 w-full" : "p-3 justify-center aspect-square"}`}>
          <MessageSquarePlus className="w-5 h-5 flex-shrink-0" />
          {leftSidebarOpen && <span className="whitespace-nowrap">New Article</span>}
        </button>

        <div className="mt-auto w-full">
           <button className={`flex items-center gap-3 text-gray-400 hover:text-white transition-colors w-full p-2 rounded-lg hover:bg-white/5 ${!leftSidebarOpen && "justify-center"}`}>
            <Settings className="w-5 h-5 flex-shrink-0" />
            {leftSidebarOpen && <span className="font-medium">Settings</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden pt-14 lg:pt-0 relative">
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-10 max-w-4xl mx-auto w-full scroll-smooth">
          <div className="mb-8">
            {loading.process ? (
               <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse"></div>
            ) : (
              <h1 className="text-2xl md:text-3xl font-bold leading-tight font-sora">{title}</h1>
            )}
          </div>

          <div className="flex items-start gap-4 bg-white/5 p-6 rounded-xl border border-white/5">
            <Sparkles className={`w-6 h-6 text-blue-400 mt-1 flex-shrink-0 ${loading.process ? 'animate-spin' : ''}`} />
            <div className="w-full">
              <h3 className="text-lg font-semibold mb-3 font-sora">Perspective Analysis</h3>
              <div className="text-gray-300 space-y-4 leading-relaxed text-[15px] font-sora">
                <p>{perspectiveText}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 md:p-6 border-t border-white/10 bg-background-dark z-10">
          <div className="max-w-4xl mx-auto relative">
            <input type="text" placeholder="Ask Questions about this article..." className="w-full bg-[#1B1F24] border border-white/10 rounded-lg px-4 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none focus:border-white/30 font-sora transition-all shadow-sm" />
            <button className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1 rounded-md hover:bg-white/10 transition-all">
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </main>

      {/* Right Sidebar Component */}
      <RightSidebar 
        isOpen={rightSidebarOpen} 
        onToggle={() => setRightSidebarOpen(!rightSidebarOpen)}
        loading={loading.bias}
        biasScore={biasScore}
        scoreConfig={scoreConfig}
        summary={analysisData?.perspective?.short_title}
      />
    </div>
  );
}