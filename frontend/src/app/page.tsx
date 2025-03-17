"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Sparkles, Users, BarChart3, MessageSquare } from "lucide-react";
import Navbar from "@/app/components/Navbar";
import AnalyzeButton from "@/app/components/Utils/AnalyzeButton";
import DescCard from "@/app/components/Utils/DescCard";
import Link from "next/link";
import { Brain } from "lucide-react";

export default function Home() {
  const [article_url, setArticleURL] = useState("");
  const router = useRouter();

  const handleSubmit = useCallback(() => {
    if (!article_url.trim()) return;
    const encodedURL = encodeURIComponent(article_url);
    router.push(`/article?url=${encodedURL}`);
  }, [article_url, router]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      <main className="flex-1 container px-4 py-16 md:py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-500 to-amber-500 tracking-tight">
          Discover Different Perspectives
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-300 max-w-2xl mx-auto">
          Enter an article URL to analyze multiple viewpoints and engage in
          meaningful discussions.
        </p>

        {/* Input Field */}
        <div className="max-w-2xl mx-auto mt-8 flex items-center space-x-2">
          <Input
            type="text"
            placeholder="Type a URL..."
            className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 h-12 pr-4 focus-visible:ring-teal-500"
            value={article_url}
            onChange={(e) => setArticleURL(e.target.value)}
          />
          <Button
            className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white h-12 px-6"
            onClick={handleSubmit}
            disabled={!article_url.trim()}
          >
            <Sparkles className="mr-2 h-4 w-4" /> Analyze Site
          </Button>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          {[
            {
              icon: <Users className="h-8 w-8 text-teal-500" />,
              title: "Multiple Perspectives",
              description: "Get diverse viewpoints from reliable sources.",
            },
            {
              icon: <BarChart3 className="h-8 w-8 text-amber-500" />,
              title: "AI-Powered Analysis",
              description: "Advanced AI summarizes different opinions.",
            },
            {
              icon: <MessageSquare className="h-8 w-8 text-blue-500" />,
              title: "Interactive Discussion",
              description: "Engage in meaningful conversations.",
            },
          ].map((feature, index) => (
            <Card key={index} className="p-6 shadow-lg">
              <CardHeader className="flex items-center space-x-4">
                {feature.icon}
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 dark:text-gray-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>


      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-5">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-teal-500" />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              © 2025 Perspective AI
            </span>
          </div>
          <div className="flex items-center gap-6">
            <Link
              href="/privacy"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/contact"
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-teal-500 dark:hover:text-teal-400 transition-colors"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
