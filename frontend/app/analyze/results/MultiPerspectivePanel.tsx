"use client";

import { useState, useCallback } from "react";
import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const LENSES = [
    {
        id: "educational",
        label: "Educational",
        icon: "school",
        color: "#06e0f9",
        desc: "Impact on learning & knowledge",
    },
    {
        id: "technical",
        label: "Technical",
        icon: "memory",
        color: "#a78bfa",
        desc: "Feasibility & implementation",
    },
    {
        id: "political",
        label: "Political",
        icon: "account_balance",
        color: "#f87171",
        desc: "Policy & power dynamics",
    },
    {
        id: "economic",
        label: "Economic",
        icon: "trending_up",
        color: "#4ade80",
        desc: "Market impact & inequality",
    },
    {
        id: "social",
        label: "Social",
        icon: "groups",
        color: "#fbbf24",
        desc: "Community & culture",
    },
    {
        id: "global",
        label: "Global",
        icon: "public",
        color: "#38bdf8",
        desc: "International & cross-border",
    },
];

interface PerspectiveResult {
    lens: string;
    lens_label: string;
    content: string;
    cached: boolean;
    article_metadata?: {
        summary?: string;
        main_claim?: string;
        entities?: string[];
        tone?: string;
        key_points?: string[];
    };
}

interface Props {
    articleUrl: string;
}

export default function MultiPerspectivePanel({ articleUrl }: Props) {
    const [activeLens, setActiveLens] = useState<string | null>(null);
    const [loadingLens, setLoadingLens] = useState<string | null>(null);
    const [results, setResults] = useState<Record<string, PerspectiveResult>>({});
    const [error, setError] = useState<string | null>(null);

    const handleLensClick = useCallback(
        async (lensId: string) => {
            setActiveLens(lensId);
            setError(null);

            // Already fetched — just show it
            if (results[lensId]) return;

            setLoadingLens(lensId);
            try {
                const res = await axios.post(`${API_URL}/api/perspective/generate`, {
                    url: articleUrl,
                    lens: lensId,
                });
                setResults((prev) => ({ ...prev, [lensId]: res.data }));
            } catch (e: any) {
                const msg =
                    e?.response?.data?.detail || "Failed to generate perspective. Please try again.";
                setError(msg);
            } finally {
                setLoadingLens(null);
            }
        },
        [articleUrl, results]
    );

    const activeLensData = LENSES.find((l) => l.id === activeLens);
    const activeResult = activeLens ? results[activeLens] : null;

    return (
        <div className="glass-card rounded-xl overflow-hidden bg-white/5 border border-white/10 mt-6">
            {/* Header */}
            <div className="p-5 border-b border-white/10 flex items-center gap-3 bg-black/20">
                <div className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <span className="material-symbols-outlined text-primary text-sm">
                        flip_to_back
                    </span>
                </div>
                <div>
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-200 font-mono">
                        Multi-Perspective Analysis
                    </h2>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        Select a lens to generate a perspective from that domain
                    </p>
                </div>
            </div>

            {/* Lens selector grid */}
            <div className="p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                    {LENSES.map((lens) => {
                        const isActive = activeLens === lens.id;
                        const isLoading = loadingLens === lens.id;
                        const isCached = !!results[lens.id];

                        return (
                            <button
                                key={lens.id}
                                onClick={() => handleLensClick(lens.id)}
                                disabled={isLoading}
                                className={`relative group p-4 rounded-xl border text-left transition-all duration-200 cursor-none ${isActive
                                        ? "border-white/30 bg-white/10 scale-[1.02]"
                                        : "border-white/5 bg-black/20 hover:bg-white/5 hover:border-white/15"
                                    } disabled:opacity-60`}
                                style={
                                    isActive
                                        ? { boxShadow: `0 0 20px ${lens.color}22, 0 0 1px ${lens.color}66` }
                                        : {}
                                }
                            >
                                {/* Cached badge */}
                                {isCached && !isActive && (
                                    <span
                                        className="absolute top-2 right-2 text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                                        style={{ background: `${lens.color}22`, color: lens.color }}
                                    >
                                        cached
                                    </span>
                                )}

                                <div
                                    className="size-8 rounded-lg flex items-center justify-center mb-2"
                                    style={{ background: `${lens.color}15`, border: `1px solid ${lens.color}30` }}
                                >
                                    {isLoading ? (
                                        <div
                                            className="size-3 rounded-full border-2 border-t-transparent animate-spin"
                                            style={{ borderColor: `${lens.color}40 ${lens.color}40 ${lens.color}40 transparent` }}
                                        />
                                    ) : (
                                        <span
                                            className="material-symbols-outlined text-sm"
                                            style={{ color: lens.color }}
                                        >
                                            {lens.icon}
                                        </span>
                                    )}
                                </div>
                                <p
                                    className="text-xs font-bold uppercase tracking-wider"
                                    style={{ color: isActive ? lens.color : "#94a3b8" }}
                                >
                                    {lens.label}
                                </p>
                                <p className="text-[10px] text-slate-600 font-mono mt-0.5 leading-tight">
                                    {lens.desc}
                                </p>
                            </button>
                        );
                    })}
                </div>

                {/* Result display */}
                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400 text-xs font-mono">
                        ⚠ {error}
                    </div>
                )}

                {loadingLens && !activeResult && (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
                        <div
                            className="size-10 rounded-full border-2 border-t-transparent animate-spin"
                            style={{
                                borderColor: `${activeLensData?.color || "#06e0f9"}40 ${activeLensData?.color || "#06e0f9"}40 ${activeLensData?.color || "#06e0f9"}40 transparent`,
                            }}
                        />
                        <p className="text-xs font-mono uppercase tracking-widest">
                            Generating {activeLensData?.label} perspective...
                        </p>
                    </div>
                )}

                {activeResult && activeLensData && (
                    <div
                        className="rounded-xl border p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300"
                        style={{
                            background: `${activeLensData.color}08`,
                            borderColor: `${activeLensData.color}25`,
                        }}
                    >
                        {/* Lens header */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div
                                    className="size-7 rounded-lg flex items-center justify-center"
                                    style={{
                                        background: `${activeLensData.color}15`,
                                        border: `1px solid ${activeLensData.color}30`,
                                    }}
                                >
                                    <span
                                        className="material-symbols-outlined text-sm"
                                        style={{ color: activeLensData.color }}
                                    >
                                        {activeLensData.icon}
                                    </span>
                                </div>
                                <h3
                                    className="text-xs font-bold uppercase tracking-widest font-mono"
                                    style={{ color: activeLensData.color }}
                                >
                                    {activeResult.lens_label} Perspective
                                </h3>
                            </div>
                            {activeResult.cached && (
                                <span
                                    className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full"
                                    style={{
                                        background: `${activeLensData.color}15`,
                                        color: activeLensData.color,
                                        border: `1px solid ${activeLensData.color}30`,
                                    }}
                                >
                                    ⚡ Cached
                                </span>
                            )}
                        </div>

                        {/* Article metadata strip (if available) */}
                        {activeResult.article_metadata?.main_claim && (
                            <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                                <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-1">
                                    Main Claim
                                </p>
                                <p className="text-xs text-slate-300 font-serif italic">
                                    {activeResult.article_metadata.main_claim}
                                </p>
                            </div>
                        )}

                        {/* Generated content */}
                        <div className="font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                            {activeResult.content}
                        </div>

                        {/* Key points if available */}
                        {activeResult.article_metadata?.key_points &&
                            activeResult.article_metadata.key_points.length > 0 && (
                                <div className="border-t border-white/5 pt-4">
                                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mb-2">
                                        Key Points from Article
                                    </p>
                                    <ul className="space-y-1">
                                        {activeResult.article_metadata.key_points.map((kp, i) => (
                                            <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                                                <span
                                                    className="mt-0.5 size-1.5 rounded-full shrink-0"
                                                    style={{ background: activeLensData.color }}
                                                />
                                                {kp}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                    </div>
                )}

                {!activeLens && !error && (
                    <div className="flex flex-col items-center justify-center py-10 text-slate-600">
                        <span className="material-symbols-outlined text-4xl mb-3">
                            flip_to_back
                        </span>
                        <p className="text-xs font-mono uppercase tracking-widest text-center">
                            Select a perspective lens above
                            <br />
                            to generate a domain-specific analysis
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
