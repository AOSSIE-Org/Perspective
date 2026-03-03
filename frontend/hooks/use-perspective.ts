import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/config";

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

export interface AnalysisData {
  thread_id?: string;
  article_summary?: string;
  web_search_citations?: Citation[];
  sentiment?: string;
  perspective?: {
    short_title?: string;
    perspective?: string;
    reasoning_steps?: string[];
  };
  facts?: Fact[];
  score?: number;
  status?: string;
}

interface BiasData {
  score?: number;
}

/* ------------------------------------------------------------------ */
/*  Hook                                                               */
/* ------------------------------------------------------------------ */

export function usePerspective() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [biasData, setBiasData] = useState<BiasData | null>(null);
  const [articleUrl, setArticleUrl] = useState("");
  const [provider, setProvider] = useState("groq");
  const [loading, setLoading] = useState({ bias: false, process: false });

  useEffect(() => {
    const fetchData = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      const storedProvider = sessionStorage.getItem("selectedProvider") || "groq";
      const storedAnalysis = sessionStorage.getItem("analysisResult");
      const storedBias = sessionStorage.getItem("BiasScore");

      if (storedUrl) setArticleUrl(storedUrl);
      setProvider(storedProvider);

      if (storedAnalysis) setAnalysisData(JSON.parse(storedAnalysis));
      if (storedBias) setBiasData(JSON.parse(storedBias));

      if (!storedUrl || (storedBias && storedAnalysis)) return;

      /* ---------- Bias score ---------- */
      if (!storedBias) {
        setLoading((prev) => ({ ...prev, bias: true }));
        try {
          const res = await fetch(`${API_BASE_URL}/api/bias`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: storedUrl }),
          });
          if (res.ok) {
            const data = await res.json();
            const score = parseInt(data.bias_score, 10);
            if (!isNaN(score)) {
              setBiasData({ score });
              sessionStorage.setItem("BiasScore", JSON.stringify({ score }));
            }
          }
        } catch (e) {
          console.error("Bias error:", e);
        } finally {
          setLoading((prev) => ({ ...prev, bias: false }));
        }
      }

      /* ---------- Full analysis ---------- */
      if (!storedAnalysis) {
        setLoading((prev) => ({ ...prev, process: true }));
        try {
          const res = await fetch(`${API_BASE_URL}/api/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: storedUrl, provider: storedProvider }),
          });
          if (res.ok) {
            const data: AnalysisData = await res.json();
            setAnalysisData(data);
            sessionStorage.setItem("analysisResult", JSON.stringify(data));
          }
        } catch (e) {
          console.error("Process error:", e);
        } finally {
          setLoading((prev) => ({ ...prev, process: false }));
        }
      }
    };

    fetchData();
  }, []);

  /* ---------- Derived values ---------- */
  const biasScore = biasData?.score ?? analysisData?.score ?? 0;

  const getScoreColor = () => {
    if (biasScore <= 30)
      return { text: "text-green-500", gradient: ["#22c55e", "#14b8a6"], label: "Low Bias" };
    if (biasScore <= 60)
      return { text: "text-yellow-500", gradient: ["#eab308", "#f59e0b"], label: "Moderate Bias" };
    return { text: "text-red-500", gradient: ["#ef4444", "#dc2626"], label: "High Bias" };
  };

  return {
    analysisData,
    biasData,
    loading,
    biasScore,
    scoreConfig: getScoreColor(),
    articleUrl,
    provider,
    setProvider,
  };
}