

"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Card,
  CardContent,
  Slide,
  Fade,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import Navbar from "@/app/components/Navbar";

interface Reliability {
  true_percentage: number;
  fake_percentage: number;
}

interface FactCheckState {
  article_text: string;
  resources: any[];
  reliability: Reliability;
}

const DarkContainer = styled(Container)(({ theme }) => ({
  backgroundColor: "#0D2538",
  minHeight: "100vh",
  paddingTop: theme.spacing(4),
  paddingBottom: theme.spacing(4),
  color: "#FFFFFF",
}));

export default function FactCheckPage() {
  const searchParams = useSearchParams();
  const url = searchParams.get("url") || "";
  const [data, setData] = useState<FactCheckState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFactCheck = async () => {
      try {
        const res = await fetch("http://localhost:8000/fact-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        if (!res.ok) {
          throw new Error("Failed to fetch fact-check data");
        }
        const result = await res.json();
        console.log("Fact-check result:", result);
        setData(result);
      } catch (err: any) {
        setError(err.message || "Error during fact checking");
      } finally {
        setLoading(false);
      }
    };

    if (url) {
      fetchFactCheck();
    } else {
      setError("No URL provided for fact checking");
      setLoading(false);
    }
  }, [url]);

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
    <Typography variant="h3" align="center" gutterBottom>
      Article Reliability
    </Typography>

    {loading ? (
      <Box display="flex" justifyContent="center" alignItems="center" sx={{ height: "150px" }}>
        <CircularProgress sx={{ color: "#00A6FB" }} />
      </Box>
    ) : error ? (
      <Fade in>
        <Typography variant="body1" color="error" align="center">
          {error}
        </Typography>
      </Fade>
    ) : data?.reliability ? (
      <Slide direction="up" in timeout={{ enter: 500 }}>
        <Card sx={{ mb: 2, bgcolor: "rgba(0,0,0,0.5)", color: "white", boxShadow: 5 }}>
          <CardContent>
            {/* <Typography variant="h4" align="center" gutterBottom>
              Reliability Score
            </Typography> */}
            <Typography variant="body1" align="center" sx={{ fontSize: "1.7rem", fontWeight: "bold" }}>
              ✅ True: {data.reliability.true_percentage}% &nbsp;|&nbsp; ❌ Fake: {data.reliability.fake_percentage}%
            </Typography>
          </CardContent>
        </Card>
      </Slide>
    ) : (
      <Fade in>
        <Typography align="center">No data available.</Typography>
      </Fade>
    )}
  </Box>
  </>
  );
}

