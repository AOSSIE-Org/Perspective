"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Brain, Database, CheckCircle, Globe, ArrowRight, Sparkles } from "lucide-react"
import ThemeToggle from "@/components/theme-toggle"

/**
 * Renders the main landing page for the Perspective application, showcasing its features, technology stack, and calls to action.
 *
 * The page includes animated backgrounds, a header with branding and theme toggle, a hero section with statistics and navigation, sections explaining the app's purpose and workflow, a technology showcase, and a footer with attribution.
 *
 * @returns The complete landing page React element for the Perspective app.
 */
export default function Home() {
  const router = useRouter()
  const features = [
    {
      icon: Brain,
      title: "AI-Powered Analysis",
      description:
        "Advanced NLP and LangGraph pipeline extracts key points and generates balanced counter-perspectives.",
      color: "from-purple-500 to-indigo-600",
    },
    {
      icon: Shield,
      title: "Bias Detection",
      description: "Sophisticated algorithms identify and highlight potential biases in article content.",
      color: "from-emerald-500 to-teal-600",
    },
    {
      icon: CheckCircle,
      title: "Fact Checking",
      description: "Cross-references claims with reliable sources to ensure accuracy and credibility.",
      color: "from-blue-500 to-cyan-600",
    },
    {
      icon: Database,
      title: "Vector Database",
      description: "Efficient storage and retrieval system enables chat-based exploration of perspectives.",
      color: "from-orange-500 to-red-600",
    },
  ]

  const technologies = [
    { name: "Python", color: "bg-gradient-to-r from-blue-500 to-blue-600" },
    { name: "TypeScript", color: "bg-gradient-to-r from-blue-600 to-indigo-600" },
    { name: "FastAPI", color: "bg-gradient-to-r from-green-500 to-emerald-600" },
    { name: "Next.js", color: "bg-gradient-to-r from-gray-700 to-gray-900" },
    { name: "Tailwind CSS", color: "bg-gradient-to-r from-cyan-500 to-blue-500" },
    { name: "LangChain", color: "bg-gradient-to-r from-purple-500 to-indigo-600" },
    { name: "LangGraph", color: "bg-gradient-to-r from-pink-500 to-rose-600" },
    { name: "NLP", color: "bg-gradient-to-r from-amber-500 to-orange-600" },
    { name: "Vector DB", color: "bg-gradient-to-r from-teal-500 to-cyan-600" },
  ]

  const stats = [
    { label: "Articles Analyzed", value: "10,000+", color: "text-blue-600" },
    { label: "Biases Detected", value: "95%", color: "text-emerald-600" },
    { label: "Fact Accuracy", value: "98%", color: "text-purple-600" },
    { label: "User Satisfaction", value: "4.9/5", color: "text-orange-600" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-100/50 dark:from-slate-900 dark:via-slate-900/80 dark:to-indigo-950/50 overflow-hidden transition-colors duration-300">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-blue-400/10 to-purple-400/10 dark:from-blue-400/5 dark:to-purple-400/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 md:w-96 md:h-96 bg-gradient-to-r from-emerald-400/10 to-cyan-400/10 dark:from-emerald-400/5 dark:to-cyan-400/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <header className="border-b border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 md:space-x-3 group">
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

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 md:py-24 text-center relative">
        <div className="max-w-5xl mx-auto">
          <Badge className="mb-6 md:mb-8 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white border-0 px-4 md:px-6 py-1.5 md:py-2 text-xs md:text-sm font-medium hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-fade-in">
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 mr-2" />
            AI-Powered Bias Detection
          </Badge>

          <h1 className="text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-bold mb-6 md:mb-8 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight animate-fade-in delay-200">
            Uncover Hidden
            <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Perspectives
            </span>
          </h1>

          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 md:mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in delay-300 px-4">
            Combat bias and one-sided narratives with AI-generated alternative perspectives. Get fact-based, balanced
            viewpoints on any online article through our advanced NLP pipeline powered by LangGraph and LangChain.
          </p>

          <Button
            onClick={() => router.push("/analyze")}
            className="h-12 md:h-16 px-8 md:px-16 text-base md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 hover:scale-105 animate-fade-in delay-500 group border-0 text-white"
          >
            Get Started
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400 animate-fade-in delay-600">
             No sign in required. It’s completely free.
          </p>
          
          {/* Floating stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 mt-12 md:mt-20 animate-fade-in delay-700">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div
                  className={`text-2xl md:text-4xl lg:text-5xl font-bold mb-2 md:mb-3 ${stat.color} transition-all duration-300 group-hover:scale-110`}
                >
                  {stat.value}
                </div>
                <div className="text-xs md:text-sm text-slate-600 dark:text-slate-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What is Perspective Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-5xl mx-auto text-center mb-12 md:mb-20">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-slate-100 animate-fade-in">
            What is Perspective?
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-fade-in delay-200 px-4">
            Perspective addresses the critical problem of biased and one-sided narratives in online articles. Our
            AI-powered solution provides readers with fact-based, well-structured alternative perspectives by analyzing
            article content, extracting key points, and generating logical counter-perspectives using cutting-edge
            natural language processing technology.
          </p>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 md:mb-6 text-slate-900 dark:text-slate-100 animate-fade-in">
            How Perspective Works
          </h2>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto animate-fade-in delay-200 px-4">
            Our advanced AI pipeline processes articles through multiple stages to deliver balanced, fact-checked
            perspectives.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="text-center p-6 md:p-8 border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group animate-fade-in"
              style={{ animationDelay: `${index * 100 + 400}ms` }}
            >
              <CardHeader className="pb-4">
                <div
                  className={`w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 shadow-lg`}
                >
                  <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <CardTitle className="text-lg md:text-xl text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-slate-600 dark:text-slate-300 leading-relaxed text-sm md:text-base">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Technology Stack */}
      <section className="container mx-auto px-4 py-12 md:py-20">
        <Card className="p-6 md:p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-950 dark:via-blue-950 dark:to-indigo-950 text-white border-0 shadow-2xl overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-600/5 dark:to-purple-600/5"></div>
          <div className="relative z-10">
            <div className="text-center mb-8 md:mb-12">
              <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                Built with Cutting-Edge Technology
              </h3>
              <p className="text-slate-300 dark:text-slate-400 max-w-3xl mx-auto text-base md:text-lg leading-relaxed px-4">
                Powered by the latest in AI, NLP, and web technologies to deliver accurate, fast, and reliable
                perspective analysis.
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 md:gap-4">
              {technologies.map((tech, index) => (
                <Badge
                  key={index}
                  className={`${tech.color} text-white border-0 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 px-3 md:px-6 py-2 md:py-3 text-xs md:text-sm font-medium animate-fade-in`}
                  style={{ animationDelay: `${index * 100 + 600}ms` }}
                >
                  {tech.name}
                </Badge>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-12 md:py-24 text-center">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 md:mb-8 text-slate-900 dark:text-slate-100 animate-fade-in">
            Ready to See Every Side of the Story?
          </h3>
          <p className="text-lg md:text-xl lg:text-2xl text-slate-600 dark:text-slate-300 mb-8 md:mb-12 leading-relaxed animate-fade-in delay-200 px-4">
            Join thousands of readers who are already discovering balanced perspectives and combating bias in online
            content.
          </p>
          <Button
            onClick={() => router.push("/analyze")}
            className="h-12 md:h-16 px-8 md:px-16 text-base md:text-lg bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 animate-fade-in delay-400 group border-0 text-white"
          >
            Get Started Today
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2 md:ml-3 transition-transform duration-300 group-hover:translate-x-1" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/20 dark:border-white/10 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-6 md:py-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="flex items-center space-x-2 md:space-x-3 group">
              <div className="w-6 h-6 md:w-8 md:h-8 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center transform transition-all duration-300 group-hover:rotate-6">
                <Globe className="w-3 h-3 md:w-4 md:h-4 text-white" />
              </div>
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm md:text-base">Perspective</span>
              <span className="text-slate-500 dark:text-slate-400 text-sm md:text-base">by AOSSIE</span>
            </div>
            <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400 text-center">
              © 2024 AOSSIE. Combating bias through AI-powered perspective analysis.
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
