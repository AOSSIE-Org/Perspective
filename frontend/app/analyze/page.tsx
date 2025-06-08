"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Globe, ArrowRight, Link, Sparkles, Shield, Brain, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import ThemeToggle from "@/components/theme-toggle"

/**
 * Renders the main page for submitting an article URL to initiate AI-powered analysis.
 *
 * Provides a user interface for entering and validating an article URL, displays real-time feedback on URL validity, and enables users to trigger analysis. Features include a branded header, a hero section, a URL input card with validation, a grid highlighting analysis capabilities, and example article URLs for quick testing. On valid submission, the URL is stored in sessionStorage and the user is navigated to a loading page for further processing.
 */
export default function AnalyzePage() {
  const [url, setUrl] = useState("")
  const [isValidUrl, setIsValidUrl] = useState(false)
  const router = useRouter()

  const validateUrl = (inputUrl: string) => {
    try {
      new URL(inputUrl)
      setIsValidUrl(true)
    } catch {
      setIsValidUrl(false)
    }
  }

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputUrl = e.target.value
    setUrl(inputUrl)
    if (inputUrl.length > 0) {
      validateUrl(inputUrl)
    } else {
      setIsValidUrl(false)
    }
  }

  const handleAnalyze = () => {
    if (isValidUrl && url) {
      // Store the URL in sessionStorage to pass to loading page
      sessionStorage.setItem("articleUrl", url)
      router.push("/analyze/loading")
    }
  }

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
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 dark:from-emerald-400/5 dark:to-cyan-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
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
      <main className="container mx-auto px-4 py-8 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 md:mb-16">
            <Badge className="mb-6 md:mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
              <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
              AI-Powered Analysis
            </Badge>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight animate-fade-in delay-200">
              Analyze Any Article
            </h1>

            <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed animate-fade-in delay-300 px-4">
              Paste the URL of any online article and get AI-powered bias detection, fact-checking, and alternative
              perspectives in seconds.
            </p>
          </div>

          {/* URL Input Section */}
          <Card className="p-6 md:p-8 mb-8 md:mb-12 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-0 shadow-2xl animate-fade-in delay-400">
            <CardHeader className="text-center pb-4 md:pb-6 px-0">
              <CardTitle className="text-xl md:text-2xl text-slate-900 dark:text-slate-100 mb-2">
                Enter Article URL
              </CardTitle>
              <CardDescription className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
                Provide the link to the article you want to analyze for bias and alternative perspectives
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              <div className="flex flex-col gap-4">
                <div className="flex-1 relative">
                  <Link className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4 md:w-5 md:h-5" />
                  <Input
                    type="url"
                    placeholder="https://example.com/article"
                    value={url}
                    onChange={handleUrlChange}
                    className="pl-10 md:pl-12 h-12 md:h-14 text-sm md:text-lg border-2 border-slate-200 dark:border-slate-700 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                  {url && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isValidUrl ? (
                        <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-emerald-500" />
                      ) : (
                        <div className="w-4 h-4 md:w-5 md:h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-red-500"></div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={!isValidUrl || !url}
                  className="h-12 md:h-14 px-6 md:px-8 text-sm md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 group border-0 text-white w-full md:w-auto"
                >
                  Analyze Article
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
              </div>
              {url && !isValidUrl && (
                <p className="text-red-500 text-xs md:text-sm mt-2 ml-10 md:ml-12">Please enter a valid URL</p>
              )}
            </CardContent>
          </Card>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-8 md:mb-12">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="text-center p-4 md:p-6 border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group animate-fade-in"
                style={{ animationDelay: `${index * 100 + 600}ms` }}
              >
                <CardHeader className="pb-3 md:pb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 md:mb-4 transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg">
                    <feature.icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                  </div>
                  <CardTitle className="text-base md:text-lg text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-600 dark:text-slate-300 text-sm md:text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Example URLs */}
          <Card className="p-4 md:p-6 bg-gradient-to-r from-slate-100 to-blue-50 dark:from-slate-800 dark:to-slate-700 border-0 animate-fade-in delay-900">
            <CardHeader className="pb-3 md:pb-4 px-0">
              <CardTitle className="text-base md:text-lg text-slate-900 dark:text-slate-100">
                Try These Example Articles
              </CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="space-y-2">
                {[
                  "https://www.bbc.com/news/technology",
                  "https://www.reuters.com/business/",
                  "https://www.theguardian.com/world",
                ].map((exampleUrl, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setUrl(exampleUrl)
                      setIsValidUrl(true)
                    }}
                    className="block w-full text-left p-2 md:p-3 rounded-lg hover:bg-white/50 dark:hover:bg-slate-600/50 transition-colors text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm md:text-base break-all"
                  >
                    {exampleUrl}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
