


"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Box,
  Stack,
  CircularProgress,
  Tab,
  Tabs
} from "@mui/material";
import ChatMessage from "@/app/components/ChatMessage";
import Navbar from "@/app/components/Navbar";
import { useSearchParams } from "next/navigation";
import TextToSpeech from "../components/TextToSpeech";
import ExportButton from "../components/Utils/ExportButton";
import RelatedTopicsSidebar from "../components/RelatedTopicsSidebar";
import ResearchDashboard from "../components/research-dashboard";
import { SummaryData } from "../components/research-dashboard";

export default function Article() {
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);
  const [research, setResearch] = useState<any>(null);
  const [summary, setSummary] = useState("");
  const [perspective, setPerspective] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isPerspectiveLoading, setIsPerspectiveLoading] = useState(true);
  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarToggle = (isOpen: boolean) => {
    setIsSidebarOpen(isOpen);
  };

  useEffect(() => {
    setUrl(articleUrl);
  }, [articleUrl]);

  useEffect(() => {
    if (articleUrl) {
      const fetchData = async () => {
        try {
          // Request Deep Research
          const research_response = await fetch("http://localhost:8000/deep-research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl })
          });
          const research_data = await research_response.json();
          setResearch(research_data.research);

          // Get article summary
          const response = await fetch("http://localhost:8000/scrape-and-summarize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl })
          });
          const data = await response.json();
          const summaryText = data.summary;
          if (!summaryText) {
            throw new Error("Summary text not found in response");
          }
          setSummary(summaryText);
          setIsSummaryLoading(false);

          // Request for AI perspective using the summary text
          const resPerspective = await fetch("http://localhost:8000/generate-perspective", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ summary: summaryText })
          });
          const dataPerspective = await resPerspective.json();
          setPerspective(dataPerspective.perspective);
          setIsPerspectiveLoading(false);
        } catch (error) {
          console.error("Error fetching article analysis:", error);
          setIsSummaryLoading(false);
          setIsPerspectiveLoading(false);
        }
      };
      fetchData();
    }
  }, [articleUrl]);

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (message.trim()) {
      setMessage("");
    }
  };

  const cardStyle = {
    bgcolor: "white",
    boxShadow: 3,
    borderRadius: "20px",
    position: "relative" as "relative", // to position the button absolutely
    "& .MuiCardContent-root": { borderRadius: "20px" }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <>
      <Navbar />
      <Box
        sx={{
          bgcolor: "#111827",
          background:
            "linear-gradient(90deg, rgba(7, 0, 40, 1) 0%, rgba(23, 6, 66, 1) 50%, rgba(19, 0, 47, 1) 100%)",
          color: "white",
          minHeight: "100vh",
          py: 8
        }}
      >
        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            pt: 4,
            transition: "transform 0.3s ease",
            transform: isSidebarOpen ? "translateX(-190px)" : "translateX(0)"
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            centered
            textColor="inherit"
            indicatorColor="primary"
            sx={{ borderBottom: "2px solid rgba(255, 255, 255, 0.2)" }}
          >
            <Tab label="AI Perspective" sx={{ fontSize: "1.6rem", textTransform: "none", color: "white" }} />
            <Tab label="Deep Research" sx={{ fontSize: "1.6rem", textTransform: "none", color: "white" }} />
          </Tabs>
          {tabIndex === 0 && (
            <Stack spacing={6} className="mt-4">
              {/* Summary Section */}
              {isSummaryLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "150px" }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Card sx={cardStyle}>
                  {/* Fact Check Button at top right of the summary card */}
                  <Box sx={{ position: "absolute", top: 8, right: 8 }}>
                    <Link href={`/fact-check?url=${encodeURIComponent(url || "")}`} passHref legacyBehavior>
                      <Button variant="contained" color="secondary" size="small">
                        Fact Check
                      </Button>
                    </Link>
                  </Box>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.main">
                      Article Summary
                    </Typography>
                    <TextToSpeech text={summary} />
                    <Typography variant="body1" paragraph>
                      {summary}
                    </Typography>
                    <Typography variant="subtitle2" color="textSecondary" fontWeight="bold">
                      Source Article:
                    </Typography>
                    <Typography
                      variant="body2"
                      color="primary"
                      component="a"
                      href={url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{ wordBreak: "break-word" }}
                    >
                      {url}
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Perspective Section */}
              {isPerspectiveLoading ? (
                <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "150px" }}>
                  <CircularProgress color="primary" />
                </Box>
              ) : (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.main">
                      AI Perspective
                    </Typography>
                    <TextToSpeech text={perspective} />
                    <div>{perspective}</div>
                  </CardContent>
                </Card>
              )}

              {/* Discussion Section */}
              <Card sx={cardStyle}>
                <CardContent sx={{ p: 4, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                  <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.main">
                    Discussion
                  </Typography>
                  <ExportButton />
                  <Box sx={{ flexGrow: 1, overflowY: "auto", maxHeight: 400, mb: 3, borderRadius: "16px" }}>
                    <ChatMessage isAI={true} message="Hello! I've analyzed the article. What would you like to know about it?" />
                  </Box>
                  <Box component="form" onSubmit={handleSubmit} display="flex" gap={2}>
                    <TextField
                      fullWidth
                      variant="outlined"
                      placeholder="Ask a question about the article..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                    />
                    <Button type="submit" variant="contained" color="primary" sx={{ borderRadius: "12px", px: 4 }}>
                      Send
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Stack>
          )}
          {tabIndex === 1 && research ? (
            <ResearchDashboard data={research as SummaryData} />
          ) : (
            tabIndex === 1 && (
              <Box className="flex justify-center items-center h-full w-full mt-10">
                <CircularProgress />
              </Box>
            )
          )}
        </Container>
      </Box>
      <RelatedTopicsSidebar
        currentArticleUrl={url || undefined}
        currentArticleSummary={summary || undefined}
        onSidebarToggle={handleSidebarToggle}
      />
    </>
  );
}
