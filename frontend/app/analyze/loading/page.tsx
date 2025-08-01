"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Globe,
  Brain,
  Shield,
  CheckCircle,
  Database,
  Sparkles,
  Zap,
} from "lucide-react";
import ThemeToggle from "@/components/theme-toggle";
import axios from "axios";

/**
 * Displays a multi-step animated loading and progress interface for the article analysis workflow.
 *
 * Guides the user through sequential analysis steps—fetching the article, AI analysis, bias detection, fact checking, and generating perspectives—while visually indicating progress and status. Retrieves the article URL from session storage, automatically advances through each step, and redirects to the results page upon completion. If no article URL is found, redirects to the analysis input page.
 *
 * @remark This component manages its own navigation and redirects based on session state.
 */
export default function LoadingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [articleUrl, setArticleUrl] = useState("");
  const router = useRouter();

  const steps = [
    {
      icon: Globe,
      title: "Fetching Article",
      description: "Retrieving content from the provided URL",
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: Brain,
      title: "AI Analysis",
      description: "Processing content with advanced NLP algorithms",
      color: "from-purple-500 to-indigo-500",
    },
    {
      icon: Shield,
      title: "Bias Detection",
      description: "Identifying potential biases and one-sided perspectives",
      color: "from-emerald-500 to-teal-500",
    },
    {
      icon: CheckCircle,
      title: "Fact Checking",
      description: "Cross-referencing claims with reliable sources",
      color: "from-orange-500 to-red-500",
    },
    {
      icon: Database,
      title: "Generating Perspectives",
      description: "Creating balanced alternative viewpoints",
      color: "from-pink-500 to-rose-500",
    },
  ];

  useEffect(() => {
    const runAnalysis = async () => {
      const storedUrl = sessionStorage.getItem("articleUrl");
      if (storedUrl) {
        setArticleUrl(storedUrl);

        try {
          const [processRes, biasRes] = await Promise.all([
            axios.post(
              "https://Thunder1245-perspective-backend.hf.space/api/process",
              {
                url: storedUrl,
              }
            ),
            axios.post(
              "http://Thunder1245-perspective-backend.hf.space/api/bias",
              {
                url: storedUrl,
              }
            ),
          ]);


          sessionStorage.setItem("BiasScore", JSON.stringify(biasRes.data));

          console.log("Bias score saved");
          console.log(biasRes);

          // Save response to sessionStorage
          sessionStorage.setItem(
            "analysisResult",
            JSON.stringify(processRes.data)
          );

          console.log("Analysis result saved");
          console.log(processRes);

          
          // optional logging
        } catch (err) {
          console.error("Failed to process article:", err);
          router.push("/analyze"); // fallback in case of error
          return;
        }

        // Progress and step simulation
        const stepInterval = setInterval(() => {
          setCurrentStep((prev) => {
            if (prev < steps.length - 1) {
              return prev + 1;
            } else {
              clearInterval(stepInterval);
              setTimeout(() => {
                router.push("/analyze/results");
              }, 2000);
              return prev;
            }
          });
        }, 2000);

        const progressInterval = setInterval(() => {
          setProgress((prev) => {
            if (prev < 100) {
              return prev + 1;
            }
            return prev;
          });
        }, 100);

        return () => {
          clearInterval(stepInterval);
          clearInterval(progressInterval);
        };
      } else {
        router.push("/analyze");
      }
    };

    runAnalysis();
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 transition-colors duration-300 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 dark:from-blue-400/10 dark:to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-emerald-400/20 to-cyan-400/20 dark:from-emerald-400/10 dark:to-cyan-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[600px] md:h-[600px] bg-gradient-to-r from-indigo-400/10 to-pink-400/10 dark:from-indigo-400/5 dark:to-pink-400/5 rounded-full blur-3xl animate-spin"
          style={{ animationDuration: "20s" }}
        ></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div
            className="flex items-center space-x-2 md:space-x-3 group cursor-pointer"
            onClick={() => router.push("/")}
          >
            <div className="w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-xl flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Globe className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </div>
            <span className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perspective
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Status Badge */}
          <Badge className="mb-6 md:mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium animate-pulse">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            AI Processing in Progress
          </Badge>

          {/* Main Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
            Analyzing Your Article
          </h1>

          {/* Article URL Display */}
          <div className="mb-8 md:mb-12 p-3 md:p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg backdrop-blur-sm">
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm mb-2">
              Processing:
            </p>
            <p className="text-blue-600 dark:text-blue-400 font-medium truncate text-sm md:text-base">
              {articleUrl}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12 md:mb-16">
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 md:h-3 mb-3 md:mb-4 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-full transition-all duration-300 ease-out relative"
                style={{
                  width: `${Math.min(progress, (currentStep + 1) * 20)}%`,
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
            <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm">
              {Math.min(progress, (currentStep + 1) * 20)}% Complete
            </p>
          </div>

          {/* Processing Steps */}
          <div className="grid gap-4 md:gap-6 max-w-2xl mx-auto">
            {steps.map((step, index) => (
              <Card
                key={index}
                className={`p-4 md:p-6 border-0 transition-all duration-500 ${
                  index === currentStep
                    ? "bg-white dark:bg-slate-800 shadow-2xl scale-105 ring-2 ring-blue-500/50"
                    : index < currentStep
                    ? "bg-white/80 dark:bg-slate-800/80 shadow-lg opacity-75"
                    : "bg-white/40 dark:bg-slate-800/40 shadow-md opacity-50"
                }`}
              >
                <div className="flex items-center space-x-3 md:space-x-4">
                  <div
                    className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center transition-all duration-500 ${
                      index === currentStep
                        ? `bg-gradient-to-br ${step.color} animate-pulse shadow-lg`
                        : index < currentStep
                        ? "bg-gradient-to-br from-emerald-500 to-teal-500 shadow-md"
                        : "bg-slate-200 dark:bg-slate-700"
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    ) : index === currentStep ? (
                      <step.icon
                        className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin"
                        style={{ animationDuration: "2s" }}
                      />
                    ) : (
                      <step.icon className="w-5 h-5 md:w-6 md:h-6 text-slate-400" />
                    )}
                  </div>
                  <div className="flex-1 text-left">
                    <h3
                      className={`font-semibold mb-1 transition-colors duration-300 text-sm md:text-base ${
                        index === currentStep
                          ? "text-blue-600 dark:text-blue-400"
                          : index < currentStep
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-slate-500 dark:text-slate-400"
                      }`}
                    >
                      {step.title}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm">
                      {step.description}
                    </p>
                  </div>
                  {index === currentStep && (
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-indigo-500 rounded-full animate-bounce delay-100"></div>
                      <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-purple-500 rounded-full animate-bounce delay-200"></div>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* AI Processing Animation */}
          <div className="mt-12 md:mt-16 flex justify-center">
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 border-4 border-blue-200 dark:border-blue-800 rounded-full animate-spin">
                <div
                  className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-blue-600 rounded-full animate-spin"
                  style={{ animationDuration: "1s" }}
                ></div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Zap className="w-6 h-6 md:w-8 md:h-8 text-blue-600 animate-pulse" />
              </div>
            </div>
          </div>

          <p className="mt-6 md:mt-8 text-slate-600 dark:text-slate-300 text-base md:text-lg px-4">
            Our AI is working hard to provide you with comprehensive analysis...
          </p>
        </div>
      </main>
    </div>
  );
}
