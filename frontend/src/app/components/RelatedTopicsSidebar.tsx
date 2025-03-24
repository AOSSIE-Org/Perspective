
"use client"

import React, { useState } from "react"
import { 
  Drawer, 
  Box, 
  Typography, 
  IconButton, 
  List, 
  ListItem, 
  Link, 
  CircularProgress,
} from "@mui/material"
import {
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material"
import { getRelatedTopics } from "../../../actions/scrape.actions"

interface RelatedTopicsSidebarProps {
  currentArticleUrl?: string
  currentArticleSummary?: string
  width?: number
  onSidebarToggle?: (isOpen: boolean) => void
}

export default function RelatedTopicsSidebar({
  currentArticleUrl,
  currentArticleSummary,
  width = 380,
  onSidebarToggle,
}: RelatedTopicsSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [topics, setTopics] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // Toggle sidebar and notify parent component
  const toggleSidebar = (open: boolean) => {
    setIsOpen(open)
    if (onSidebarToggle) {
      onSidebarToggle(open)
    }
  }

  // Process topics string to extract links
  const parseTopics = (topicsStr: string) => {
    let parsedTopics: { linkText: string; linkUrl: string }[] = []
    if (topicsStr.startsWith("\\boxed{") && topicsStr.endsWith("}")) {
      // Remove the \boxed{ and trailing }
      const cleaned = topicsStr.slice(7, -1).trim()
      try {
        const urls = JSON.parse(cleaned)
        parsedTopics = urls.map((url: string) => ({
          linkText: url,
          linkUrl: url,
        }))
      } catch (err) {
        console.error("Error parsing topics JSON:", err)
      }
    } else {
      // Fallback: parse markdown links from the string
      parsedTopics = topicsStr
        .split("\n")
        .filter((line) => line.includes("]("))
        .map((line) => {
          const match = line.match(/\[([^\]]+)\]\(([^)]+)\)/)
          if (!match) return null
          return { linkText: match[1], linkUrl: match[2] }
        })
        .filter((item): item is { linkText: string; linkUrl: string } => item !== null);
    }
    return parsedTopics
  }

  const generatelinks = () => {
    if (currentArticleUrl) {
      setIsLoading(true)
      const fetchData = async () => {
        try {
          const requestURL: string = "http://localhost:8000/related-topics"
          const resTopics = await getRelatedTopics(requestURL, currentArticleSummary);

          console.log("Received related topics response:", resTopics)
          setTopics(resTopics.topics || "")
        } catch (error) {
          console.error("Error fetching related topics:", error)
          setTopics("")
        } finally {
          setIsLoading(false)
        }
      }
      fetchData()
    }
  }

  // Parse the topics to display as a list
  const parsedTopics = parseTopics(topics)

  return (
    <>
      <IconButton 
        onClick={() => {
          toggleSidebar(!isOpen)
          generatelinks()
        }}
        sx={{
          position: 'fixed', 
          top: '50%', 
          right: isOpen ? width : 0, 
          transform: 'translateY(-50%)',
          zIndex: 1200,
          bgcolor: '#5F27CD',
          color: 'white',
          '&:hover': {
            bgcolor: '#4B1E8F'
          },
          boxShadow: 3,
          p: 2,
          mr: isOpen ? 1 : -1, 
          transition: 'right 0.3s ease',
        }}
      >
        {/* You can change the icon as needed */}
        <ArrowBackIcon />
      </IconButton>

      <Drawer
        variant="temporary"
        anchor="right"
        open={isOpen}
        onClose={() => toggleSidebar(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width,
            boxSizing: "border-box",
            borderLeft: "1px solid rgba(0, 0, 0, 0.12)",
            background: "#F3E5F5",
            top: 0,
            height: "100vh",
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            p: 2,
            borderBottom: "1px solid rgba(0, 0, 0, 0.12)",
            bgcolor: "#5F27CD",
            color: "white",
          }}
        >
          {currentArticleUrl && (
            <IconButton
              component={Link}
              href={currentArticleUrl}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: "white", mr: 1 }}
            >
              <ArrowBackIcon />
            </IconButton>
          )}
          <Typography variant="h5" component="div" sx={{ flexGrow: 1 }}>
            Related Links
          </Typography>
          <IconButton onClick={() => toggleSidebar(false)} size="small" sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Content */}
        <Box sx={{ overflow: "auto", flexGrow: 1, p: 2 }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {parsedTopics.map((item, index) => (
                <ListItem key={index} disableGutters>
                  <Box
                    sx={{
                      border: "1px solid rgba(0, 0, 0, 0.12)",
                      borderRadius: 1,
                      p: 1.5,
                      width: "100%",
                      background: "white",
                    }}
                  >
                    <Link
                      href={item.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      underline="hover"
                      sx={{ fontSize: "1rem", color: "#5F27CD", fontWeight: 500 }}
                    >
                      {item.linkText}
                    </Link>
                  </Box>
                </ListItem>
              ))}
            </List>
          )}
        </Box>
      </Drawer>
    </>
  )
}
