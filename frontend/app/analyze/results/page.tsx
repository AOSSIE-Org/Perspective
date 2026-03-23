"use client";

import type React from "react";
import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BiasMeter from "@/components/bias-meter";
import axios from "axios";

const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000").trim();

/**
 * Renders the article analysis page with summary, perspectives, fact checks, bias meter, AI chat, and sources.
 */
export default function AnalyzePage() {
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [biasScore, setBiasScore] = useState<any>(null);
  const router = useRouter();
  const isRedirecting = useRef(false);
  const [activeTab, setActiveTab] = useState("summary");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    [
      {
        role: "system",
        content:
          "Welcome to the Perspective chat. You can ask me questions about this article or request more information about specific claims.",
      },
    ]
  );

  useEffect(() => {
    const storedBiasScore = sessionStorage.getItem("BiasScore");
    const storedData = sessionStorage.getItem("analysisResult");
    if (storedBiasScore && storedData) {
      setIsLoading(false);
    }

    if (storedBiasScore) setBiasScore(JSON.parse(storedBiasScore).bias_score);
    else console.warn("No bias score found.");

    if (storedData) setAnalysisData(JSON.parse(storedData));
    else console.warn("No analysis result found");
  }, []);

  useEffect(() => {
    if (isRedirecting.current) {
      return;
    }

    const storedData = sessionStorage.getItem("analysisResult");
    const storedBiasScore = sessionStorage.getItem("BiasScore");

    if (storedBiasScore && storedData) {
      // inside here TS knows storedBiasScore and storedData are strings
      setBiasScore(JSON.parse(storedBiasScore).bias_score);
      setAnalysisData(JSON.parse(storedData));
      setIsLoading(false);
    } else {
      console.warn("No bias or data found. Redirecting...");
      if (!isRedirecting.current) {
        isRedirecting.current = true;
        router.push("/analyze"); // 🔹 You can also add a toast here
      }
    }
  }, [router]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    const userMessage = message.trim();
    if (!userMessage || isChatLoading) return;

    const newMessages = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setMessage("");
    setIsChatLoading(true);

    try {
      const articleContext = analysisData?.cleaned_text?.trim() ?? "";
      const res = await axios.post(
        `${backendUrl}/api/chat`,
        {
          message: userMessage,
          article_context: articleContext,
        },
        { timeout: 45000 }
      );
      const answer = res.data?.answer ?? "I could not generate an answer right now.";

      setMessages([...newMessages, { role: "assistant", content: answer }]);
    } catch (error: any) {
      const fallback =
        error?.response?.data?.detail ||
        error?.message ||
        "Chat request failed. Please try again.";
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: `Sorry, I couldn't fetch a reply: ${fallback}`,
        },
      ]);
    } finally {
      setIsChatLoading(false);
    }
  }

  const cleanedTextForView = analysisData?.cleaned_text ?? "";

  const articleLayout = useMemo(() => {
    if (!cleanedTextForView) {
      return {
        highlights: [] as string[],
        sections: [] as { title: string | null; paragraphs: string[] }[],
      };
    }

    const blocks = cleanedTextForView
      .split(/\n{2,}/)
      .map((block: string) => block.trim())
      .filter(Boolean);

    const isTitleLike = (block: string) => {
      const wordCount = block.split(/\s+/).length;
      return (
        block.length <= 90 &&
        wordCount <= 12 &&
        !/[.]$/.test(block) &&
        !/^\d+[.)]/.test(block)
      );
    };

    const highlights: string[] = [];
    const sections: { title: string | null; paragraphs: string[] }[] = [];

    for (let i = 0; i < blocks.length; i += 1) {
      const block = blocks[i];
      const nextBlock = blocks[i + 1];

      if (isTitleLike(block)) {
        if (nextBlock && !isTitleLike(nextBlock)) {
          sections.push({ title: block, paragraphs: [nextBlock] });
          i += 1;
        } else {
          highlights.push(block);
        }
        continue;
      }

      const lastSection = sections[sections.length - 1];
      if (lastSection && lastSection.paragraphs.length < 2) {
        lastSection.paragraphs.push(block);
      } else {
        sections.push({ title: null, paragraphs: [block] });
      }
    }

    return { highlights, sections };
  }, [cleanedTextForView]);

  const articleStats = useMemo(() => {
    const words = cleanedTextForView.trim()
      ? cleanedTextForView.trim().split(/\s+/).length
      : 0;
    const readTimeMin = words > 0 ? Math.max(1, Math.round(words / 220)) : 0;

    return {
      words,
      readTimeMin,
      sectionCount: articleLayout.sections.length,
    };
  }, [cleanedTextForView, articleLayout.sections.length]);

   if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Analyzing content...</div>
      </div>
    );
  }


  const {
    facts = [],
    sentiment,
    perspective,
  } = analysisData;

  

  

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header omitted for brevity */}
      <main className="flex-1 pt-16 container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Analysis Results</h1>
          <Badge
            variant={
              sentiment === "positive"
                ? "secondary"
                : sentiment === "negative"
                ? "destructive"
                : "outline"
            }
            className="capitalize"
          >
            Sentiment: {sentiment}
          </Badge>
        </div>
        <div className="bg-card rounded-lg border p-4 mb-8">
          <BiasMeter score={biasScore} />
          <p className="text-sm mt-2">Bias Score: {biasScore}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="summary">Article</TabsTrigger>
                <TabsTrigger value="perspectives">Perspective</TabsTrigger>
                <TabsTrigger value="facts">Fact Check</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-b from-card via-card to-card/70 p-5 sm:p-7">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-primary/10 to-transparent" />

                  <div className="relative mb-6 flex flex-wrap gap-2">
                    <Badge variant="outline">{articleStats.sectionCount} sections</Badge>
                    <Badge variant="outline">{articleStats.words} words</Badge>
                    <Badge variant="outline">~{articleStats.readTimeMin} min read</Badge>
                  </div>

                  {articleLayout.highlights.length > 0 && (
                    <section className="relative mb-5 rounded-xl border border-border/70 bg-background/40 p-4 sm:p-5">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-primary/90">
                        Article Highlights
                      </p>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {articleLayout.highlights.map((headline: string, idx: number) => (
                          <div
                            key={`${headline}-${idx}`}
                            className="rounded-lg border border-border/60 bg-card/60 px-3 py-2 text-sm font-medium text-foreground/90"
                          >
                            {headline}
                          </div>
                        ))}
                      </div>
                    </section>
                  )}

                  <div className="relative space-y-4 sm:space-y-5">
                    {articleLayout.sections.map(
                      (
                        section: { title: string | null; paragraphs: string[] },
                        idx: number
                      ) => (
                        <article
                          key={idx}
                          className="rounded-xl border border-border/70 bg-background/40 p-4 sm:p-5"
                        >
                          <div className="mb-3 flex items-center gap-3">
                            <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-primary/15 px-2 text-xs font-semibold text-primary">
                              {(idx + 1).toString().padStart(2, "0")}
                            </span>
                            <h3 className="text-lg font-semibold leading-snug text-foreground">
                              {section.title ?? `Key Point ${idx + 1}`}
                            </h3>
                          </div>

                          <div className="space-y-3">
                            {section.paragraphs.map((paragraph: string, pIdx: number) => (
                              <p
                                key={pIdx}
                                className={`text-base leading-8 text-foreground/90 ${
                                  idx === 0 && pIdx === 0
                                    ? "first-letter:float-left first-letter:mr-2 first-letter:text-3xl first-letter:font-semibold first-letter:leading-none"
                                    : ""
                                }`}
                              >
                                {paragraph}
                              </p>
                            ))}
                          </div>
                        </article>
                      )
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="perspectives">
                {perspective ? (
                  <div className="space-y-4">
                    <h2 className="text-xl font-semibold">
                      Counter-Perspective
                    </h2>
                    <p className="italic">"{perspective.perspective}"</p>
                    <h3 className="font-medium">Reasoning:</h3>
                    <p>{perspective.reasoning}</p>
                  </div>
                ) : (
                  <div className="text-muted-foreground p-4">
                    No counter-perspective was generated for this content.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="facts">
                <div className="space-y-4">
                  {facts.length > 0 ? (
                    facts.map((fact: any, idx: number) => (
                      <Card key={idx} className="border">
                        <CardHeader>
                          <div className="flex justify-between items-center">
                            <CardTitle>{fact.original_claim}</CardTitle>
                            <Badge
                              variant={
                                fact.verdict === "True"
                                  ? "secondary"
                                  : fact.verdict === "False"
                                  ? "destructive"
                                  : "outline"
                              }
                            >
                              {fact.verdict}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="mb-2">{fact.explanation}</p>
                          <Link
                            href={fact.source_link}
                            target="_blank"
                            className="flex items-center text-sm hover:underline"
                          >
                            <LinkIcon className="mr-1 h-4 w-4" /> Source
                          </Link>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-muted-foreground p-4">
                      No specific claims were identified for fact-checking in
                      this content.
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="h-full flex flex-col">
              <CardHeader>
                <CardTitle>AI Discussion</CardTitle>
                <CardDescription>
                  Ask questions about this article
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                  {messages.map((msg, i) => (
                    <div
                      key={i}
                      className={`${
                        msg.role === "user" ? "justify-end" : "justify-start"
                      } flex`}
                    >
                      <div
                        className={`p-2 rounded ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}
                </div>
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Input
                    placeholder="Ask a question..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                  <Button type="submit" disabled={!message.trim() || isChatLoading}>
                    <Send />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      {/* Footer omitted */}
    </div>
  );
}