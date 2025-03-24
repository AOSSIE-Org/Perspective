"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Box, Typography, Stack } from "@mui/material";
import Navbar from "@/app/components/Navbar";
import AnalyzeButton from "@/app/components/Utils/AnalyzeButton";
import DescCard from "@/app/components/Utils/DescCard";




export default function Home() {
  const [articleUrl,setArticleURL] = useState("")
  const router = useRouter();



  const handleSubmit = useCallback(() => {
    if (!articleUrl.trim()) return; // Prevents navigation if the input is empty
    const encodedURL = encodeURIComponent(articleUrl);
    router.push(`/article?url=${encodedURL}`);
  }, [articleUrl, router]);
  

  return (
    <Box sx={{ bgcolor: "#111827", color: "white", minHeight: "100vh" }}>
      <Navbar />
      <Container maxWidth="lg" sx={{ py: 8, textAlign: "center" }}>
        <Typography
          variant="h2"
          fontWeight="bold"
          gutterBottom
          sx={{
            background: "linear-gradient(90deg, #3b82f6, #2563eb)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent"
          }}
        >
          Discover Different Perspectives
        </Typography>
        <Typography variant="h6" sx={{ maxWidth: 600, mx: "auto" }}>
          Enter an article URL to analyze multiple viewpoints and engage in
          discussions.
        </Typography>

        {/* Input field */}
        <Box maxWidth="sm" mx="auto" mt={4}>
          <div className="relative">
            <input
              type="text"
              placeholder="Type a URL..."
              required
              value={articleUrl}
              onChange={(e) => setArticleURL(e.target.value)}
              className="peer text-white text-[1.2rem] bg-transparent w-full box-border px-[1em] py-[0.8em] border-0 border-b-[var(--border-height)] border-b-solid border-b-[var(--border-before-color)] shadow-[0_4px_8px_rgba(0,0,0,0.1)] focus:outline-none"
            />
            <span className="absolute bottom-0 left-0 w-0 peer-focus:w-full h-[3px] transition-[width_0.4s_cubic-bezier(0.42,0,0.58,1)] bg-[linear-gradient(90deg,#707070_0%,#909090_25%,#00BFFF_50%,#909090_75%,#707070_100%)]" />
          </div>

          {/* Analyze button */}
          <Box
            display="flex"
            justifyContent="center"
            mt={2}
            onClick={handleSubmit}
          >
            <AnalyzeButton />
          </Box>
        </Box>
        <Stack
          spacing={4}
          direction={{ xs: "column", md: "row" }}
          justifyContent="center"
          mt={6}
        >
          {[
            {
              title: "Multiple Perspectives",
              description: "Get diverse viewpoints from reliable sources."
            },
            {
              title: "AI-Powered Analysis",
              description: "Advanced AI summarizes different opinions."
            },
            {
              title: "Interactive Discussion",
              description: "Engage in meaningful conversations."
            }
          ].map((feature, index) => <DescCard key={index} {...feature} />)}
        </Stack>
      </Container>
    </Box>
  );
}
