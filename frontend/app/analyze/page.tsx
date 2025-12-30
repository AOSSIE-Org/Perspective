"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  ArrowRight,
  Link,
  Sparkles,
  Shield,
  Brain,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/theme-toggle";

export default function AnalyzePage() {
  const [url, setUrl] = useState("");
  const [isValidUrl, setIsValidUrl] = useState(false);
  const router = useRouter();

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl);
      setIsValidUrl(true);
    } catch {
      setIsValidUrl(false);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value;
    setUrl(inputUrl);
    if (inputUrl.length > 0) {
      validateUrl(inputUrl);
    } else {
      setIsValidUrl(false);
    }
  };

  const handleAnalyze = () => {
    if (isValidUrl && url) {
      sessionStorage.setItem("articleUrl", url);
      router.push("/analyze/loading");
    }
  };

  const features = [
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Advanced NLP extracts key points and arguments",
    },
    {
      icon: Shield,
      title: "Bias Detection",
      description: "Identifies potential biases and one-sided perspectives",
    },
    {
      icon: CheckCircle,
      title: "Fact Verification",
      description: "Cross-references claims with reliable sources",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 dark:from-emerald-400/5 dark:to-cyan-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 lg:px-6 py-3.5 flex items-center justify-between max-w-7xl">
          <div
            className="flex items-center space-x-2.5 group cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-9 h-9 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Globe className="w-4.5 h-4.5 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perspective
            </span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 lg:px-6 py-8 md:py-12 max-w-6xl relative z-10">
        <div className="max-w-4xl mx-auto">
          
          {/* Hero Section - Compact */}
          <div className="text-center mb-8 md:mb-10">
            <Badge className="mb-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-5 py-2 text-sm font-medium shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5 animate-fade-in inline-flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI-Powered Analysis
            </Badge>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight animate-fade-in delay-100">
              Analyze Any Article
            </h1>

            <p className="text-base md:text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed animate-fade-in delay-200">
              Paste the URL of any online article and get AI-powered bias detection, fact-checking, and alternative perspectives in seconds.
            </p>
          </div>

          {/* URL Input Section - Elevated & Less Boxy */}
          <div className="mb-10 md:mb-14 animate-fade-in delay-300">
            <Card className="border-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl shadow-2xl hover:shadow-3xl transition-all duration-500 overflow-hidden">
              <div className="p-6 md:p-8 lg:p-10">
                <div className="text-center mb-6">
                  <h2 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
                    Enter Article URL
                  </h2>
                  <p className="text-sm md:text-base text-slate-600 dark:text-slate-400">
                    Provide the link to the article you want to analyze
                  </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1 relative group">
                    <Link className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors w-5 h-5" />
                    <Input
                      type="url"
                      placeholder="https://example.com/article"
                      value={url}
                      onChange={handleUrlChange}
                      className="pl-12 pr-12 h-14 text-base border-2 border-slate-200/80 dark:border-slate-700/80 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-4 focus:ring-blue-500/10 transition-all duration-300 bg-white dark:bg-slate-900/50"
                    />
                    {url && (
                      <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                        {isValidUrl ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 animate-scale-in" />
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleAnalyze}
                    disabled={!isValidUrl || !url}
                    className="h-14 px-8 text-base font-semibold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 hover:scale-[1.02] active:scale-[0.98] group border-0 text-white whitespace-nowrap"
                  >
                    Analyze Article
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                  </Button>
                </div>
                
                {url && !isValidUrl && (
                  <p className="text-red-500 text-sm mt-3 ml-12 animate-fade-in flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    Please enter a valid URL
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Features Grid - Softer Design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-10">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-6 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:bg-white/90 dark:hover:bg-slate-800/90 hover:border-blue-300/50 dark:hover:border-blue-700/50 hover:shadow-xl transition-all duration-500 hover:-translate-y-1 animate-fade-in cursor-default"
                style={{ animationDelay: `${index * 100 + 400}ms` }}
              >
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 dark:from-blue-500/20 dark:via-indigo-500/20 dark:to-purple-500/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Example URLs - Streamlined */}
          <div className="p-5 md:p-6 bg-gradient-to-br from-slate-100/80 to-blue-100/80 dark:from-slate-800/80 dark:to-slate-700/80 backdrop-blur-sm rounded-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in delay-700">
            <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Try Example Articles
            </h3>
            <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mb-4">
              Click any URL to test the analyzer
            </p>
            
            <div className="space-y-2">
              {[
                "https://www.bbc.com/news/technology",
                "https://www.reuters.com/business/",
                "https://www.theguardian.com/world",
              ].map((exampleUrl, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setUrl(exampleUrl);
                    setIsValidUrl(true);
                  }}
                  className="flex items-center justify-between w-full text-left px-4 py-2.5 rounded-lg bg-white/60 dark:bg-slate-900/40 hover:bg-white dark:hover:bg-slate-900/70 border border-transparent hover:border-blue-300/50 dark:hover:border-blue-700/50 transition-all duration-300 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm group"
                >
                  <span className="truncate mr-2 font-medium">{exampleUrl}</span>
                  <ArrowRight className="w-4 h-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
