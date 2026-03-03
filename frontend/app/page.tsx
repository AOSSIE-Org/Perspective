"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface NodeData {
  desc: string;
  icon: string;
  color: string;
  cot: string[];
  [key: string]: any;
}

export interface NodeTypeWithName extends NodeData {
  name: string;
}

const nodeData: Record<string, NodeData> = {
  "Input": {
    desc: "Handles raw content ingestion from multiple sources including URLs, PDFs, and plain text. Performs initial cleaning and sanitization of the input data.",
    icon: "input",
    color: "#94a3b8",
    cot: ["> Identifying content format: [Web Article]", "> Sanitizing HTML tags and advertisements", "> Normalizing character encoding for downstream parsing"]
  },
  "Fact Fetch": {
    desc: "Automatically identifies key claims within the input and triggers asynchronous searches across trusted academic and news databases.",
    icon: "cloud_download",
    color: "#94a3b8",
    cot: ["> Extracting claim: 'DeFi policy shifts are greed-motivated'", "> Querying World Bank Policy Database...", "> Retrieving 4 related liquidity incentive reports"]
  },
  "Narrative Parse": {
    desc: "Uses advanced NLP to map the emotional tone, rhetorical devices, and logical fallacies present in the original narrative.",
    icon: "segment",
    color: "#94a3b8",
    cot: ["> Sentiment Analysis: [Cynical/Skeptical]", "> Detecting Rhetorical Device: [Ad Hominem]", "> Mapping narrative arc for 'Greed' theme"]
  },
  "Updated Facts*": {
    desc: "Performs real-time cross-verification. It resolves contradictions between sources and updates the pipeline with the most current, verified data points.",
    icon: "verified",
    color: "#06e0f9",
    cot: ["> Comparing Input Claim vs. Verified Reports", "> Result: Claim found to be 62% speculative", "> Injecting current APR data from Uniswap v3 protocol"]
  },
  "Reasoned Thinking*": {
    desc: "A specialized LLM agent that applies first-principles thinking to synthesize information without the bias of common online discourse.",
    icon: "auto_awesome",
    color: "#ffbf00",
    cot: ["> Breaking problem into basic components: [Liquidity], [Risk], [Reward]", "> Applying Economic Game Theory principles", "> Constructing non-biased logical bridge"]
  },
  "Bias Detect": {
    desc: "Scans for algorithmic echo-chamber patterns and semantic leanings that might skew the user's perception of reality.",
    icon: "warning",
    color: "#94a3b8",
    cot: ["> Scanning for 'Confirmation Bias' signals", "> Identifying lack of counter-incentive mentions", "> Flagging polarizing vocabulary: 'Purely', 'Greed'"]
  },
  "Synthesis": {
    desc: "Merges the original input with the discovered facts and reasoned insights to create a comprehensive multi-dimensional perspective.",
    icon: "merge",
    color: "#94a3b8",
    cot: ["> Merging Input Node with Verified Fact Node", "> Aligning Reasoned Thinking with Narrative Structure", "> Finalizing argument balance (40/60 split)"]
  },
  "Validate": {
    desc: "A final quality control agent that checks the generated output for hallucination, factual accuracy, and adherence to the Dialectic framework.",
    icon: "rule",
    color: "#94a3b8",
    cot: ["> Verifying citations for all claims", "> Checking for internal logical consistency", "> Quality Score: 9.8/10"]
  },
  "Output": {
    desc: "The final delivery layer that formats the insights into a readable dashboard interface for the user.",
    icon: "output",
    color: "#06e0f9",
    cot: ["> Formatting Markdown structure", "> Generating visual confidence score widgets", "> Pushing to Dashboard API"]
  }
};

const TiltCard = ({ children, className }: { children: React.ReactNode, className?: string }) => {
  const [style, setStyle] = useState({});
  return (
    <div
      className={`tilt-effect transition-all ${className}`}
      style={style}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const xc = rect.width / 2;
        const yc = rect.height / 2;
        const dx = x - xc;
        const dy = y - yc;
        setStyle({ transform: `perspective(1000px) rotateX(${dy / -20}deg) rotateY(${dx / 20}deg)` });
      }}
      onMouseLeave={() => setStyle({ transform: 'perspective(1000px) rotateX(0) rotateY(0)' })}
    >
      {children}
    </div>
  );
};

export default function Home() {
  const router = useRouter();
  const [modalData, setModalData] = useState<NodeTypeWithName | null>(null);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [ringPos, setRingPos] = useState({ x: -100, y: -100 });
  const [typewriterText, setTypewriterText] = useState("");
  const typingRef = useRef(false);

  // Custom Cursor
  useEffect(() => {
    // Check if the device has a fine pointer (like a mouse)
    if (window.matchMedia("(pointer: fine)").matches) {
      document.body.classList.add("custom-cursor-enabled");
    }

    const updateMouse = (e: MouseEvent) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
      setTimeout(() => {
        setRingPos({ x: e.clientX - 11, y: e.clientY - 11 });
      }, 50);
    };
    window.addEventListener("mousemove", updateMouse);
    return () => {
      window.removeEventListener("mousemove", updateMouse);
      document.body.classList.remove("custom-cursor-enabled");
    };
  }, []);

  // Keyboard Esc Listener for Modal + Focus Restoration
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modalData) {
        setModalData(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [modalData]);

  useEffect(() => {
    if (modalData) {
      previousFocusRef.current = document.activeElement as HTMLElement;
      // Small timeout to allow render
      setTimeout(() => {
        const closeBtn = document.getElementById("close-modal-btn");
        if (closeBtn) closeBtn.focus();
      }, 50);
    } else {
      if (previousFocusRef.current) {
        previousFocusRef.current.focus();
      }
    }
  }, [modalData]);

  // Typewriter effect
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (typingRef.current) return;
    typingRef.current = true;

    const fullText = "> While the pursuit of profit is a factor, consider the structural necessity for liquidity providers in volatile markets. Without these incentives, the very infrastructure of decentralized finance could collapse, making profit models structurally essential rather than purely greedy.";
    let i = 0;

    const type = () => {
      if (!typingRef.current) return;
      if (i <= fullText.length) {
        setTypewriterText(fullText.substring(0, i));
        i++;
        timeoutId = setTimeout(type, 35);
      } else {
        timeoutId = setTimeout(() => {
          i = 0;
          setTypewriterText("");
          type();
        }, 6000);
      }
    };

    timeoutId = setTimeout(type, 1500);

    return () => {
      typingRef.current = false;
      clearTimeout(timeoutId);
    };
  }, []);

  const openNodeModal = (nodeName: string) => {
    setModalData({ name: nodeName, ...nodeData[nodeName] });
  };

  return (
    <div className="bg-background-light dark:bg-background-dark text-slate-900 dark:text-slate-100 font-display overflow-x-hidden min-h-screen">
      {/* Custom Cursor */}
      <div className="custom-cursor hidden md:block" style={{ left: cursorPos.x, top: cursorPos.y }}></div>
      <div className="custom-cursor-ring hidden md:block" style={{ left: ringPos.x, top: ringPos.y }}></div>

      {/* Nav Bar */}
      <nav className="fixed top-0 left-0 right-0 h-[68px] bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-black/5 dark:border-white/10 z-50 px-6 md:px-10">
        <div className="max-w-[1320px] mx-auto h-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-primary rounded-full animate-pulse shadow-[0_0_10px_#06e0f9]"></div>
            <h1 className="text-xl font-bold tracking-tight">
              <span className="text-primary">Perspective</span><span className="text-accent">-AI</span>
            </h1>
          </div>
          <div className="hidden lg:flex gap-10 font-mono text-[11px] tracking-[0.2em] uppercase text-slate-500 dark:text-slate-400">
            <a className="hover:text-primary transition-colors cursor-none" href="#features">Features</a>
            <a className="hover:text-primary transition-colors cursor-none" href="#how-it-works">How It Works</a>
            <a className="hover:text-primary transition-colors cursor-none" href="#pipeline">Pipeline</a>
            <a className="hover:text-primary transition-colors cursor-none" href="#stack">Stack</a>
          </div>
          <button onClick={() => router.push("/analyze")} className="border border-primary text-primary px-4 md:px-6 py-2 rounded font-bold text-xs uppercase tracking-widest hover:bg-primary/10 transition-all cursor-none z-10">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-[68px] flex items-center particle-mesh">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 px-6 md:px-10 w-full relative z-10 py-12">
          <div className="col-span-1 lg:col-span-6 flex flex-col justify-center gap-6 md:gap-8">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl leading-[1.1] dark:text-white">
              Imagine having a <span className="italic text-primary">smart, opinionated</span> friend who isn't afraid to <span className="text-accent underline decoration-1 underline-offset-[6px] md:underline-offset-8">challenge</span> your beliefs.
            </h1>
            <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-xl font-light">
              That's Perspective-AI. We break your echo chambers by injecting reasoned, factual, and challenging narratives into your digital intake.
            </p>
            <div className="flex gap-4 mt-4 relative z-20">
              <button onClick={() => router.push("/analyze")} className="bg-primary text-background-dark px-8 md:px-10 py-3 md:py-4 rounded-lg font-bold text-base md:text-lg hover:scale-105 transition-transform cursor-none">
                Launch Dashboard
              </button>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-6 flex justify-center lg:justify-end items-center mt-10 lg:mt-0">
            {/* 3D Tilting Glass Widget */}
            <TiltCard className="glass-card w-full max-w-xl min-h-[400px] md:min-h-[480px] rounded-xl p-6 md:p-8 shadow-2xl relative overflow-hidden bg-white/40 dark:bg-transparent">
              <div className="flex items-center gap-2 mb-8">
                <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
              </div>
              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-primary/80 dark:text-primary/60 font-mono">Input Content</label>
                  <div className="bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 p-4 rounded text-sm text-slate-700 dark:text-slate-300 italic">
                    "The recent policy shifts in decentralized finance are purely motivated by short-term greed..."
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] uppercase tracking-widest text-primary font-mono cursor-none">Analyzing Perspective</label>
                    <span className="text-[10px] font-mono text-primary">84%</span>
                  </div>
                  <div className="h-1 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[84%] shadow-[0_0_10px_#06e0f9]"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-accent font-mono cursor-none">Counter-Narrative Output</label>
                  <div className="bg-white/50 dark:bg-black/20 p-4 rounded font-mono text-xs leading-relaxed text-slate-800 dark:text-accent/90 border-l-2 border-accent">
                    <span className="block mb-2 text-slate-500 dark:text-white dark:opacity-50"># Initializing Reasoned Thinking...</span>
                    {typewriterText}<span className="animate-pulse">|</span>
                  </div>
                </div>
              </div>
              <div className="absolute bottom-4 right-4 p-4 opacity-10 dark:opacity-20 pointer-events-none">
                <span className="material-symbols-outlined text-6xl md:text-8xl">troubleshoot</span>
              </div>
            </TiltCard>
          </div>
        </div>
      </section>

      {/* Problem Band */}
      <section className="bg-slate-100/50 dark:bg-slate-900/50 border-y border-black/5 dark:border-white/5 py-16 md:py-20">
        <div className="max-w-[1320px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 px-10">
          <div className="text-center group">
            <p className="text-primary font-mono text-xs md:text-sm uppercase tracking-[0.3em] mb-2 cursor-none">Average User</p>
            <h3 className="text-4xl md:text-5xl font-bold dark:text-white mb-2">3.2 <span className="text-xl md:text-2xl font-light opacity-50">hrs</span></h3>
            <p className="text-slate-500">Daily Bubble Time</p>
          </div>
          <div className="text-center group md:border-x border-black/10 dark:border-white/10 py-6 md:py-0">
            <p className="text-accent font-mono text-xs md:text-sm uppercase tracking-[0.3em] mb-2 cursor-none">Algorithm Goal</p>
            <h3 className="text-4xl md:text-5xl font-bold dark:text-white mb-2">78%</h3>
            <p className="text-slate-500">Bias Reinforcement</p>
          </div>
          <div className="text-center group">
            <p className="text-primary font-mono text-xs md:text-sm uppercase tracking-[0.3em] mb-2 cursor-none">Discovery Cost</p>
            <h3 className="text-4xl md:text-5xl font-bold dark:text-white mb-2">$0</h3>
            <p className="text-slate-500">True Incentive</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 md:py-32 bg-white/50 dark:bg-background-dark">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="mb-16 md:mb-20">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Core Capabilities</h2>
            <div className="w-20 h-1 bg-primary"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { icon: 'swap_horiz', title: 'Counter-Perspective', desc: 'Challenge your existing views with dialectic logic.' },
              { icon: 'psychology', title: 'Reasoned Thinking', desc: 'Step-by-step logic-driven insights based on first principles.' },
              { icon: 'history_edu', title: 'Updated Facts', desc: 'Real-time data point verification across multiple nodes.' },
              { icon: 'link', title: 'Seamless Integration', desc: 'Workflow ready for research and content consumption.' },
              { icon: 'bolt', title: 'Real-Time Analysis', desc: 'Instant processing of complex narratives and data.' }
            ].map((f, i) => (
              <TiltCard key={i} className="feature-card glass-card p-6 md:p-8 rounded-xl flex flex-col gap-6 bg-white/40 dark:bg-transparent border border-black/5 dark:border-white/10">
                <span className={`material-symbols-outlined text-4xl ${i % 2 === 0 ? 'text-primary' : 'text-accent'}`}>{f.icon}</span>
                <div>
                  <h4 className="font-bold text-lg mb-2 text-slate-900 dark:text-white">{f.title}</h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
                </div>
              </TiltCard>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 md:py-32 relative overflow-hidden bg-background-light dark:bg-background-dark/50">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 relative z-10">
          <h2 className="text-center text-3xl md:text-4xl font-bold mb-16 md:mb-24 text-slate-900 dark:text-white">The Perspective Journey</h2>
          <div className="flex flex-col md:flex-row justify-between items-center relative gap-12 md:gap-0">
            {/* SVG Connector */}
            <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 -z-10 px-32 hidden md:block">
              <svg fill="none" height="100" viewBox="0 0 800 100" width="100%" xmlns="http://www.w3.org/2000/svg">
                <path className="opacity-30 dark:opacity-30 stroke-primary" d="M0 50C200 50 200 20 400 20C600 20 600 80 800 80" strokeDasharray="8 8" strokeWidth="2"></path>
                <path className="opacity-30 dark:opacity-30 stroke-accent" d="M0 50C200 50 200 80 400 80C600 80 600 20 800 20" strokeDasharray="8 8" strokeWidth="2"></path>
              </svg>
            </div>

            <div className="flex flex-col items-center gap-6 w-full md:w-1/4">
              <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center border-2 border-primary shadow-[0_0_20px_rgba(6,224,249,0.3)]">
                <span className="material-symbols-outlined text-primary text-3xl">search</span>
              </div>
              <div className="text-center">
                <h5 className="font-bold text-xl mb-2 text-slate-900 dark:text-white">Browse</h5>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Paste URLs, PDFs, or raw text for the engine to ingest.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full md:w-1/4">
              <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center border-2 border-slate-300 dark:border-slate-700">
                <span className="material-symbols-outlined text-slate-700 dark:text-slate-100 text-3xl">analytics</span>
              </div>
              <div className="text-center">
                <h5 className="font-bold text-xl mb-2 text-slate-900 dark:text-white">Analyze</h5>
                <p className="text-slate-600 dark:text-slate-400 text-sm">Deep narrative parsing identifies biases and hidden patterns.</p>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 w-full md:w-1/4">
              <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center border-2 border-accent shadow-[0_0_20px_rgba(255,191,0,0.3)]">
                <span className="material-symbols-outlined text-accent text-3xl">balance</span>
              </div>
              <div className="text-center">
                <h5 className="font-bold text-xl mb-2 text-slate-900 dark:text-white">See Both Sides</h5>
                <p className="text-slate-600 dark:text-slate-400 text-sm">A balanced synthesis that respects complexity.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pipeline Visualizer HTML approach */}
      <section id="pipeline" className="py-24 md:py-32 bg-white/50 dark:bg-transparent">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="col-span-1 lg:col-span-5 flex flex-col justify-center">
            <p className="text-primary font-mono text-sm tracking-widest mb-4 uppercase cursor-none">Advanced Architecture</p>
            <h2 className="text-4xl font-bold mb-6 text-slate-900 dark:text-white">The Multi-Dimensional Pipeline</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8">
              We don't just prompt an LLM. We run a deterministic graph of agents designed to verify, challenge, and synthesize information using the latest research in cognitive debiasing.
            </p>
            <ul className="space-y-4 font-mono text-sm">
              <li className="flex items-center gap-3 text-primary"><span className="w-1.5 h-1.5 bg-primary rounded-full"></span> Agentic Fact Check</li>
              <li className="flex items-center gap-3 text-slate-500"><span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Semantic Bias Detection</li>
              <li className="flex items-center gap-3 text-slate-500"><span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span> Dialectic Synthesis</li>
            </ul>
          </div>
          <div className="col-span-1 lg:col-span-7 bg-white dark:bg-background-dark/80 rounded-2xl border border-black/5 dark:border-white/5 p-6 md:p-12 min-h-[500px] md:min-h-[600px] relative overflow-hidden shadow-xl dark:shadow-none">
            <div className="absolute inset-0 particle-mesh opacity-10 dark:opacity-20 pointer-events-none"></div>

            <div className="relative w-full h-full flex items-center justify-center">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-8 md:gap-x-16 gap-y-12">
                {[
                  { id: "Input", icon: "input" },
                  { id: "Fact Fetch", icon: "cloud_download" },
                  { id: "Narrative Parse", icon: "segment" },
                  { id: "Updated Facts*", icon: "verified", special: "primary" },
                  { id: "Reasoned Thinking*", icon: "auto_awesome", special: "accent" },
                  { id: "Bias Detect", icon: "warning" },
                  { id: "Synthesis", icon: "merge" },
                  { id: "Validate", icon: "rule" },
                  { id: "Output", icon: "output", special: "dark" }
                ].map((node) => (
                  <div
                    key={node.id}
                    className="flex flex-col items-center gap-2 group hover:scale-110 transition-transform cursor-none relative focus-visible:outline-white focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-4 rounded-lg"
                    onClick={() => openNodeModal(node.id)}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${node.id} node`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openNodeModal(node.id);
                      }
                    }}
                  >
                    {node.special === "primary" ? (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center animate-pulse z-10">
                        <span className="material-symbols-outlined text-primary">{node.icon}</span>
                        <div className="absolute inset-0 rounded-full border-4 border-primary/20 scale-110 z-0 pointer-events-none"></div>
                      </div>
                    ) : node.special === "accent" ? (
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center z-10">
                        <span className="material-symbols-outlined text-accent">{node.icon}</span>
                        <div className="absolute inset-0 rounded-full border-4 border-accent/20 scale-110 z-0 pointer-events-none"></div>
                      </div>
                    ) : node.special === "dark" ? (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-primary border-2 border-primary flex items-center justify-center">
                        <span className="material-symbols-outlined text-background-dark">{node.icon}</span>
                      </div>
                    ) : (
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-lg bg-slate-100 dark:bg-slate-800 border border-black/10 dark:border-white/10 flex items-center justify-center group-hover:border-primary transition-all">
                        <span className="material-symbols-outlined text-slate-500 dark:text-slate-400">{node.icon}</span>
                      </div>
                    )}
                    <span className={`text-[10px] font-mono uppercase text-center mt-2 ${node.special === "primary" ? "text-primary font-bold" : node.special === "accent" ? "text-accent font-bold" : node.special === "dark" ? "text-slate-900 dark:text-slate-100 font-bold" : "text-slate-500"}`}>
                      {node.id}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="stack" className="py-20 border-y border-black/5 dark:border-white/5 overflow-hidden">
        <div className="flex justify-center flex-wrap gap-4 max-w-[1320px] mx-auto px-6 md:px-10">
          {['LangChain', 'LangGraph', 'GPT-4o', 'Tavily Search', 'Pinecone', 'React', 'FastAPI'].map((tech) => (
            <span key={tech} className="bg-slate-100 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300 px-4 md:px-6 py-2 rounded-full border border-black/10 dark:border-white/10 font-mono text-xs flex items-center gap-2 cursor-none hover:border-primary/50 transition-colors">
              <div className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></div> {tech}
            </span>
          ))}
        </div>
      </section>

      {/* About Section */}
      <section className="py-24 md:py-32 bg-white/50 dark:bg-transparent">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10">
          <div className="grid grid-cols-12 gap-16 mb-12 md:mb-20">
            <div className="col-span-12 text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 dark:text-white">Built for Intellectual Autonomy</h2>
              <p className="text-slate-600 dark:text-slate-400 text-lg">
                Perspective-AI was created as an antidote to the "echo chamber" effect of modern algorithms. Our mission is to provide every individual with the tools to critique information, explore opposing views, and arrive at more robust, independent conclusions.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-lg dark:shadow-none">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">savings</span>
              <h5 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">100% Free</h5>
              <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">Our core engine remains free to use for individual researchers and students committed to critical thinking.</p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-lg dark:shadow-none">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">all_inclusive</span>
              <h5 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Works on Any Content</h5>
              <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">Whether it's a social media thread, a scientific paper, or a news article, Perspective-AI parses it all.</p>
            </div>
            <div className="bg-white dark:bg-white/5 border border-black/5 dark:border-white/10 p-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 transition-colors shadow-lg dark:shadow-none">
              <span className="material-symbols-outlined text-primary text-4xl mb-6">menu_book</span>
              <h5 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">Sourced & Transparent</h5>
              <p className="text-slate-600 dark:text-slate-500 text-sm leading-relaxed">Every claim is linked back to primary sources, allowing you to trace the lineage of any counter-argument.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/10 dark:border-white/10 py-10 bg-background-light dark:bg-background-dark">
        <div className="max-w-[1320px] mx-auto px-6 md:px-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              <span className="text-primary">Perspective</span><span className="text-accent">-AI</span>
            </h2>
          </div>
          <p className="text-slate-500 text-xs font-mono uppercase tracking-widest text-center">
            Challenging Narrative, One Agent at a Time.
          </p>
          <div className="flex gap-4 md:gap-8 text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            <a className="hover:text-primary transition-colors cursor-none" href="#">Terms</a>
            <a className="hover:text-primary transition-colors cursor-none" href="#">Privacy</a>
            <a className="hover:text-primary transition-colors cursor-none" href="#">Github</a>
          </div>
        </div>
      </footer>

      {/* Node Detail Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`fixed inset-0 z-[100] flex items-center justify-center p-6 transition-all duration-300 ${modalData ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-white/80 dark:bg-[#03050e]/80 backdrop-blur-[12px]" onClick={() => setModalData(null)}></div>

        {modalData && (
          <div className="glass-card max-w-2xl w-full rounded-2xl p-6 md:p-8 relative z-10 border border-black/10 dark:border-white/10 shadow-2xl bg-white/90 dark:bg-transparent">
            <button
              id="close-modal-btn"
              aria-label="Close modal"
              className="absolute top-6 right-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors cursor-none cursor-pointer focus-visible:outline-white focus-visible:outline-2 focus-visible:outline focus-visible:outline-offset-4 rounded"
              onClick={() => setModalData(null)}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
            <div className="flex items-center gap-4 mb-8">
              <div
                className="w-16 h-16 rounded-xl flex items-center justify-center border"
                style={{ borderColor: `${modalData.color}40`, backgroundColor: `${modalData.color}10` }}
              >
                <span className="material-symbols-outlined text-3xl" style={{ color: modalData.color }}>{modalData.icon}</span>
              </div>
              <div>
                <h3 id="modal-title" className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">{modalData.name}</h3>
                <p className="text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] opacity-50 dark:text-white text-slate-900">Pipeline Component</p>
              </div>
            </div>
            <div className="space-y-6 md:space-y-8">
              <div>
                <h4 className="text-[10px] md:text-sm font-mono text-primary uppercase tracking-widest mb-2 md:mb-3">Operational Description</h4>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm md:text-base">{modalData.desc}</p>
              </div>
              <div className="bg-slate-100 dark:bg-black/40 rounded-lg p-4 md:p-6 border border-black/5 dark:border-white/5">
                <h4 className="text-[10px] md:text-xs font-mono text-accent uppercase tracking-widest mb-3 md:mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">account_tree</span> Chain-of-Thought
                </h4>
                <div className="font-mono text-xs md:text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  {modalData.cot.map((step: string, idx: number) => (
                    <p key={idx}>{step}</p>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
