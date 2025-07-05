"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Globe, MessageSquare, Send, ThumbsDown, ThumbsUp, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import BiasMeter from "@/components/bias-meter"

/**
 * Renders the article analysis page with summary, perspectives, fact checks, bias meter, AI chat, and sources.
 *
 * Provides an interactive interface for users to review an article's summary, explore alternative perspectives, verify factual claims, and engage in AI-assisted discussion. Includes responsive navigation, a bias visualization, and a curated list of references.
 */
export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState(null)
  const [activeTab, setActiveTab] = useState("summary")
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [biasScore, setBiasScore] = useState(65) // Example bias score
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    {
      role: "system",
      content:
        "Welcome to the Perspective chat. You can ask me questions about this article or request more information about specific claims.",
    },
  ])

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1500)
    const storedData = sessionStorage.getItem("analysisResult")
    if (storedData) {
      setAnalysisData(JSON.parse(storedData))
    } else {
      // fallback if user visits results page directly
      // maybe redirect or show error
      console.warn("No analysis result found")
    }

    return () => clearTimeout(timer)
  }, [])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    const newMessages = [...messages, { role: "user", content: message }]

    setMessages(newMessages)
    setMessage("")

    // Simulate AI response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "system",
          content:
            "Based on the article, the economic policy has both supporters and critics. While the government claims it will boost growth, some economists are skeptical about the projected benefits and are concerned about potential uneven distribution of benefits. Would you like me to elaborate on any specific aspect of these perspectives?",
        },
      ])
    }, 1000)
  }

  return (
    <div className="flex flex-col min-h-screen">
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Analysis Results</h1>
      <pre className="bg-black p-4 rounded text-sm overflow-x-auto whitespace-pre-wrap">
        {JSON.stringify(analysisData, null, 2)}
      </pre>
    </div>
      <header className="px-4 lg:px-6 h-14 md:h-16 flex items-center border-b backdrop-blur-sm bg-background/80 fixed w-full z-10">
        <Link className="flex items-center justify-center" href="/">
          <Globe className="h-5 w-5 md:h-6 md:w-6 mr-2 text-primary" />
          <span className="font-bold text-lg md:text-xl">Perspective</span>
        </Link>
        <div className="ml-auto flex items-center gap-2 md:gap-4">
          <Link
            href="/"
            className="hidden md:flex items-center text-sm font-medium hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Home
          </Link>
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed top-14 left-0 right-0 bg-background/95 backdrop-blur-sm border-b z-40 md:hidden">
          <div className="p-4">
            <Link href="/" className="flex items-center text-sm font-medium hover:text-primary transition-colors">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Home
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 pt-14 md:pt-16">
        {isLoading ? (
          <div className="flex items-center justify-center h-[80vh]">
            <div className="flex flex-col items-center">
              <div className="relative w-12 h-12 md:w-16 md:h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-primary/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-transparent border-t-primary rounded-full animate-spin"></div>
              </div>
              <p className="mt-4 text-muted-foreground text-sm md:text-base">Analyzing content...</p>
            </div>
          </div>
        ) : (
          <div className="container px-4 py-6 md:py-8 max-w-7xl mx-auto fade-in">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">Economic Impact of New Tax Policy</h1>
              <div className="flex flex-wrap gap-2 mb-3 md:mb-4">
                <Badge variant="outline" className="text-xs md:text-sm">
                  Economic Policy
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm">
                  Taxation
                </Badge>
                <Badge variant="outline" className="text-xs md:text-sm">
                  Business
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Source:{" "}
                <a href="#" className="text-primary hover:underline">
                  example.com
                </a>{" "}
                • Published: March 28, 2025
              </p>
            </div>

            <div className="mb-6 md:mb-8 bg-card rounded-lg border p-4 md:p-6 shadow-sm slide-up">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <BiasMeter score={biasScore} />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">Political Leaning</h3>
                    <span className="text-sm font-semibold">Center-Right</span>
                  </div>
                  <div className="relative h-3 md:h-4 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="absolute top-0 left-0 h-full w-full flex">
                      <div className="h-full w-1/5 border-r border-background/30"></div>
                      <div className="h-full w-1/5 border-r border-background/30"></div>
                      <div className="h-full w-1/5 border-r border-background/30"></div>
                      <div className="h-full w-1/5 border-r border-background/30"></div>
                      <div className="h-full w-1/5"></div>
                    </div>
                    <div className="absolute top-0 left-[62%] h-full w-3 md:w-4 bg-primary rounded-full transform -translate-x-1/2 transition-all duration-1000"></div>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Left</span>
                    <span>Center</span>
                    <span>Right</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This content leans slightly right of center in its political perspective, with an emphasis on
                    business-friendly policies.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
              <div className="lg:col-span-2">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-auto">
                    <TabsTrigger value="summary" className="transition-all text-xs md:text-sm py-2">
                      Summary
                    </TabsTrigger>
                    <TabsTrigger value="perspectives" className="transition-all text-xs md:text-sm py-2">
                      Perspectives
                    </TabsTrigger>
                    <TabsTrigger value="facts" className="transition-all text-xs md:text-sm py-2">
                      Fact Check
                    </TabsTrigger>
                  </TabsList>

                  <div className="mt-4 md:mt-6 bg-card rounded-lg border shadow-sm overflow-hidden">
                    <TabsContent value="summary" className="p-4 md:p-6 m-0 slide-in-right">
                      <div className="space-y-4">
                        <h2 className="text-lg md:text-xl font-semibold">Article Summary</h2>
                        <div className="prose dark:prose-invert max-w-none text-sm md:text-base">
                          <p>
                            The government has introduced a new tax policy aimed at boosting economic growth by
                            providing tax breaks to businesses. The policy is expected to lead to increased investment
                            and job creation across multiple sectors.
                          </p>
                          <p>
                            Finance Minister Jane Smith has expressed optimism about the policy's impact, stating that
                            reducing the tax burden on businesses will enable them to invest more in innovation and
                            expansion. Industry leaders have welcomed the move, with many planning to announce new
                            investment initiatives.
                          </p>
                          <p>
                            The stock market has responded positively to the announcement, with major indices rising.
                            The policy is set to take effect next quarter, with the government projecting a 2% increase
                            in GDP growth as a direct result.
                          </p>
                        </div>

                        <div className="mt-6 pt-6 border-t">
                          <h3 className="text-base md:text-lg font-medium mb-3">Key Points</h3>
                          <ul className="space-y-2">
                            <li className="flex items-start">
                              <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                <span className="text-xs text-primary font-medium">1</span>
                              </div>
                              <span className="text-sm md:text-base">
                                Tax breaks for businesses are the central component of the policy
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                <span className="text-xs text-primary font-medium">2</span>
                              </div>
                              <span className="text-sm md:text-base">
                                Government projects 2% GDP growth as a result
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                <span className="text-xs text-primary font-medium">3</span>
                              </div>
                              <span className="text-sm md:text-base">
                                Industry leaders and stock market have responded positively
                              </span>
                            </li>
                            <li className="flex items-start">
                              <div className="h-4 w-4 md:h-5 md:w-5 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                                <span className="text-xs text-primary font-medium">4</span>
                              </div>
                              <span className="text-sm md:text-base">
                                Implementation is scheduled for the next quarter
                              </span>
                            </li>
                          </ul>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="perspectives" className="m-0 slide-in-right">
                      <div className="divide-y">
                        <div className="p-4 md:p-6">
                          <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg md:text-xl font-semibold">Alternative Perspective</h2>
                            <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border-blue-500/20 text-xs md:text-sm">
                              Alternative
                            </Badge>
                          </div>
                          <div className="prose dark:prose-invert max-w-none text-sm md:text-base">
                            <p>
                              A more balanced approach might combine business tax incentives with targeted measures to
                              ensure broader economic benefits. For example, tax breaks could be tied to specific
                              outcomes like job creation, wage increases, or investments in underserved communities.
                            </p>
                            <p>
                              Some economists advocate for a mix of supply-side and demand-side policies. While tax
                              breaks for businesses address the supply side, complementary policies that stimulate
                              consumer spending could create a more robust economic ecosystem. This might include
                              targeted tax relief for middle and lower-income households or investments in
                              infrastructure that create jobs and improve productivity.
                            </p>
                            <p>
                              Research from various economic institutions suggests that policies with both supply-side
                              and demand-side elements tend to produce more balanced and sustainable growth across
                              different segments of the economy.
                            </p>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" className="h-7 md:h-8 gap-1 text-xs md:text-sm">
                                <ThumbsUp className="h-3 w-3 md:h-4 md:w-4" />
                                <span>Helpful</span>
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 md:h-8 gap-1 text-xs md:text-sm">
                                <ThumbsDown className="h-3 w-3 md:h-4 md:w-4" />
                                <span>Not Helpful</span>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="facts" className="m-0 slide-in-right">
                      <div className="p-4 md:p-6">
                        <h2 className="text-lg md:text-xl font-semibold mb-4">Fact Check</h2>
                        <div className="space-y-4 md:space-y-6">
                          <div className="bg-card rounded-lg border p-3 md:p-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-amber-500 md:w-[18px] md:h-[18px]"
                                >
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm md:text-base">
                                  Claim: Tax breaks always lead to job creation
                                </h3>
                                <p className="text-amber-500 font-medium text-xs md:text-sm mt-1">Partially Accurate</p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                                  Historical data shows mixed results. While some tax breaks have led to job creation,
                                  others primarily increased shareholder value or were used for stock buybacks. The
                                  relationship between tax policy and job creation is complex and depends on multiple
                                  factors.
                                </p>
                                <div className="mt-2 md:mt-3">
                                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                    View Sources (3)
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-card rounded-lg border p-3 md:p-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-amber-500 md:w-[18px] md:h-[18px]"
                                >
                                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                  <line x1="12" y1="9" x2="12" y2="13"></line>
                                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm md:text-base">Claim: 2% GDP growth projection</h3>
                                <p className="text-amber-500 font-medium text-xs md:text-sm mt-1">Contested</p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                                  Independent economic forecasts range from 0.8% to 2.3%, suggesting the government's
                                  projection may be optimistic but within the range of possibility. External factors
                                  like global trade conditions will also influence actual outcomes.
                                </p>
                                <div className="mt-2 md:mt-3">
                                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                    View Sources (4)
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-card rounded-lg border p-3 md:p-4">
                            <div className="flex items-start gap-2 md:gap-3">
                              <div className="h-6 w-6 md:h-8 md:w-8 rounded-full bg-green-500/10 flex items-center justify-center flex-shrink-0">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  className="text-green-500 md:w-[18px] md:h-[18px]"
                                >
                                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                  <polyline points="22 4 12 14.01 9 11.01"></polyline>
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium text-sm md:text-base">
                                  Claim: Stock market responded positively
                                </h3>
                                <p className="text-green-500 font-medium text-xs md:text-sm mt-1">Accurate</p>
                                <p className="text-xs md:text-sm text-muted-foreground mt-2">
                                  Market indices did rise following the announcement, with the major indices showing
                                  gains of 1.2% to 1.8% in the days following the policy announcement.
                                </p>
                                <div className="mt-2 md:mt-3">
                                  <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                                    View Sources (2)
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </div>
                </Tabs>
              </div>

              <div className="lg:col-span-1">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                      <MessageSquare className="h-4 w-4 md:h-5 md:w-5" />
                      AI Discussion
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      Ask questions about this article or explore different perspectives
                    </CardDescription>
                    <Separator />
                  </CardHeader>
                  <CardContent className="flex-1 overflow-hidden flex flex-col p-3 md:p-6">
                    <div className="flex-1 overflow-y-auto mb-3 md:mb-4 space-y-3 md:space-y-4 max-h-96">
                      {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`flex gap-2 md:gap-3 max-w-[85%] md:max-w-[80%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                          >
                            <Avatar className="h-6 w-6 md:h-8 md:w-8 flex-shrink-0">
                              {msg.role === "user" ? (
                                <>
                                  <AvatarFallback className="text-xs">U</AvatarFallback>
                                </>
                              ) : (
                                <>
                                  <AvatarImage src="/placeholder.svg?height=32&width=32" />
                                  <AvatarFallback className="text-xs">AI</AvatarFallback>
                                </>
                              )}
                            </Avatar>
                            <div
                              className={`rounded-lg px-3 py-2 text-xs md:text-sm ${
                                msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted"
                              }`}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleSendMessage} className="flex gap-2">
                      <Input
                        placeholder="Ask a question..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 h-8 md:h-10 text-xs md:text-sm"
                      />
                      <Button
                        type="submit"
                        size="icon"
                        disabled={!message.trim()}
                        className="h-8 w-8 md:h-10 md:w-10 text-white"
                      >
                        <Send className="h-3 w-3 md:h-4 md:w-4" />
                      </Button>
                    </form>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="mt-8 md:mt-12">
              <h2 className="text-lg md:text-xl font-semibold mb-3 md:mb-4">Sources & References</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                <div className="bg-card rounded-lg border p-3 md:p-4">
                  <h3 className="font-medium text-sm md:text-base">Economic Policy Institute</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    "The Effects of Corporate Tax Policies on Employment and Wages" (2024)
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Academic
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Credibility: High
                    </Badge>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-3 md:p-4">
                  <h3 className="font-medium text-sm md:text-base">National Bureau of Economic Research</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    "Tax Policy and Economic Growth: A Meta-Analysis" (2023)
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Academic
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Credibility: High
                    </Badge>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-3 md:p-4">
                  <h3 className="font-medium text-sm md:text-base">Center for Budget and Policy Priorities</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    "Distributional Effects of Business Tax Cuts" (2025)
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      Think Tank
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Credibility: Medium-High
                    </Badge>
                  </div>
                </div>

                <div className="bg-card rounded-lg border p-3 md:p-4">
                  <h3 className="font-medium text-sm md:text-base">Financial Times</h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-1">
                    "Markets React to New Tax Policy Announcement" (March 26, 2025)
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      News
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Credibility: High
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="border-t py-4 md:py-6 lg:py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 px-4 md:px-6">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            <span className="text-xs md:text-sm font-medium">© 2025 Perspective</span>
          </div>
          <nav className="flex gap-3 md:gap-4 lg:gap-6">
            <Link className="text-xs hover:text-primary transition-colors" href="#">
              Terms
            </Link>
            <Link className="text-xs hover:text-primary transition-colors" href="#">
              Privacy
            </Link>
            <Link className="text-xs hover:text-primary transition-colors" href="#">
              Contact
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
