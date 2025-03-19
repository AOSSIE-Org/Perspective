"use client";

import Navbar from "../components/Navbar";
import { useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Card,
  CardContent,
  Tab,
  Tabs
} from "@mui/material";
import TextToSpeech from "../components/TextToSpeech";
import { YouTubeEmbed } from "../components/ui/youtube-embed";
import { CardFooter } from "@/app/components/ui/card";
import { ExternalLink } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import ResearchDashboard from "../components/research-dashboard";
import { SummaryData } from "../components/research-dashboard";



export default function Home() {
  const [videoId, setVideoId] = useState(""); // Default video
  const [message, setMessage] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [tabIndex, setTabIndex] = useState(0);

  // States for API responses and loading flags
  const [summary, setSummary] = useState("");
  const [perspective, setPerspective] = useState("");
  const [isSummaryLoading, setIsSummaryLoading] = useState(true);
  const [isPerspectiveLoading, setIsPerspectiveLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const[research, setResearch] = useState()

  const searchParams = useSearchParams();
  const articleUrl = searchParams.get("url");  

  // Update URL state when articleUrl changes
  useEffect(() => {
    setUrl(articleUrl);
  }, [articleUrl]);

  // Extract video ID from URL and update videoId state
  useEffect(() => {
    if (url) {
      const id = extractVideoId(url);
      if (id) {
        setVideoId(id);
      }
    }
  }, [url]);

  // Helper function to extract video ID from various YouTube URLs
  function extractVideoId(link: string): string | null {
    try {
      const urlObj = new URL(link);
      // For youtu.be links, the pathname is the video id
      if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
      }
      // For youtube.com links, the video id is usually in the "v" parameter
      if (urlObj.hostname.includes("youtube.com")) {
        return urlObj.searchParams.get("v");
      }
    } catch (error) {
      console.error("Error extracting video id:", error);
    }
    return null;
  }

  useEffect(() => {
    if (articleUrl) {
      const fetchData = async () => {
        try {
          // API request to get Deep Research
          const research_response = await fetch("http://localhost:8000/deep-research", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl })
          });
          
          const research_data = await research_response.json();
          console.log(research_data.research)
          setResearch(research_data.research)

          // Get video summary
          const response = await fetch("http://localhost:8000/analyze-video", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: articleUrl }),
          });
          const data = await response.json();
          console.log("Received summary response:", data);

          // If there's an error (like missing subtitles), set errorMessage and skip AI perspective
          if (data.status === "error") {
            setErrorMessage(data.message);
            setIsSummaryLoading(false);
            setIsPerspectiveLoading(false);
            return;
          }

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
            body: JSON.stringify({ summary: summaryText }),
          });
          const dataPerspective = await resPerspective.json();
          console.log("Received perspective response:", dataPerspective);
          setPerspective(dataPerspective.perspective);
          setIsPerspectiveLoading(false);
        } catch (error) {
          console.error("Error fetching article analysis:", error);
          setErrorMessage("An error occurred while fetching the video analysis.");
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
    "& .MuiCardContent-root": { borderRadius: "20px" },
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
          py: 8,
        }}
      >
        <YouTubeEmbed videoId={videoId} />
        <Container
          maxWidth="lg"
          sx={{
            flexGrow: 1,
            pt: 4,
            transition: "transform 0.3s ease",
            transform: "translateX(0)",
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            centered
            textColor="inherit"
            indicatorColor="primary"
            sx={{
              borderBottom: "2px solid rgba(255, 255, 255, 0.2)"
              
            }}
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
              ) : errorMessage ? (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="error">
                      Error
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {errorMessage}
                    </Typography>
                  </CardContent>
                </Card>
              ) : (
                <Card sx={cardStyle}>
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h5" fontWeight="bold" gutterBottom color="primary.main">
                      Video Summary
                    </Typography>
                    <TextToSpeech text={summary} />
                    <Typography variant="body1" paragraph>
                      {summary}
                    </Typography>
                    <CardFooter className="pt-1">
                      <Button asChild variant="outline" size="sm" className="w-full">
                        <a
                          href={url ?? undefined}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Visit Resource
                        </a>
                      </Button>
                    </CardFooter>
                  </CardContent>
                </Card>
              )}
              

              {/* Perspective Section (only render if no error) */}
              {!errorMessage && (
                isPerspectiveLoading ? (
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
                )
              )}
              
            </Stack>
          )}
          {tabIndex === 1 && research?(<ResearchDashboard data={research as SummaryData}/>):(tabIndex ===1 && 
                    <div className="flex justify-center items-center h-full w-full mt-10">
                      <CircularProgress/>
                    </div>)}
        </Container>
      </Box>
    </>
  );
}
