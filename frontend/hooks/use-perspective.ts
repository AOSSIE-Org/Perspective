import { useState, useEffect } from "react";

interface AnalysisData {
  perspective?: {
    short_title?: string;
    perspective?: string;
    reasoning?: string[];
  };
  sentiment?: string;
  score?: number;
}

interface BiasData {
  score?: number;
  analysis?: string;
}

export function usePerspective() {
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [biasData, setBiasData] = useState<BiasData | null>(null);
  const [articleUrl, setArticleUrl] = useState("");
  const [loading, setLoading] = useState({ bias: false, process: false });

  useEffect(() => {
    const fetchData = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      const storedAnalysis = sessionStorage.getItem("analysisResult");
      const storedBias = sessionStorage.getItem("BiasScore");

      if (storedUrl) setArticleUrl(storedUrl);
      if (storedAnalysis) setAnalysisData(JSON.parse(storedAnalysis));
      if (storedBias) setBiasData(JSON.parse(storedBias));

      if (!storedUrl || (storedBias && storedAnalysis)) return;

      if (!storedBias) {
        setLoading((prev) => ({ ...prev, bias: true }));
        try {
          const res = await fetch("http://127.0.0.1:5555/api/bias", {
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

      if (!storedAnalysis) {
        setLoading((prev) => ({ ...prev, process: true }));
        try {
          const res = await fetch("http://127.0.0.1:5555/api/process", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: storedUrl }),
          });
          if (res.ok) {
            const data = await res.json();
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

  const biasScore = biasData?.score ?? analysisData?.score ?? 0;
  
  const getScoreColor = () => {
    if (biasScore <= 30) return { text: "text-green-500", gradient: ["#22c55e", "#14b8a6"], label: "Low Bias" };
    if (biasScore <= 60) return { text: "text-yellow-500", gradient: ["#eab308", "#f59e0b"], label: "Moderate Bias" };
    return { text: "text-red-500", gradient: ["#ef4444", "#dc2626"], label: "High Bias" };
  };

  return {
    analysisData,
    biasData,
    loading,
    biasScore,
    scoreConfig: getScoreColor(),
    articleUrl
  };
}