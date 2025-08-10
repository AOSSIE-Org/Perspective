"use client";

import type React from "react";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Send,
  Link as LinkIcon,
} from "lucide-react";
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
    if (storedBiasScore && storedData){
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
    router.push("/analyze");
    }

  }, [router]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setMessage("");
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: "system",
          content:
            "Based on the article... let me know if you want more details.",
        },
      ]);
    }, 1000);
  };

  if (isLoading || !analysisData || !biasScore) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground">Analyzing content...</div>
      </div>
    );
  }

  const {
    cleaned_text,
    facts = [],
    sentiment,
    perspective,
    score,
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
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="perspectives">Perspective</TabsTrigger>
                <TabsTrigger value="facts">Fact Check</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                <div className="prose max-w-none">
                  {cleaned_text
                    .split("\n\n")
                    .map((para: string, idx: number) => (
                      <p key={idx}>{para}</p>
                    ))}
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
                                  ? "success"
                                  : fact.verdict === "False"
                                  ? "destructive"
                                  : "warning"
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
                  <Button type="submit" disabled={!message.trim()}>
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
