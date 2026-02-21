import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Perspective - AI-Powered Bias Detection",
  description:
    "Combat bias and one-sided narratives with AI-generated alternative perspectives. Perspective analyzes text and provides balanced viewpoints using AI.",
  keywords: [
    "AI bias detection",
    "AI perspective analysis",
    "bias detection tool",
    "AI content evaluation",
    "alternative narrative generation",
  ],
  openGraph: {
    title: "Perspective - AI-Powered Bias Detection",
    description:
      "Analyze content for bias and generate alternative AI-driven perspectives.",
    url: "https://perspective-aossie.vercel.app/",
    siteName: "Perspective",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Perspective - AI-Powered Bias Detection",
    description:
      "AI-powered tool to analyze bias and generate alternative perspectives.",
  },
}

/**
 * Root layout component that sets up global HTML structure, font, and theming for the application.
 *
 * Wraps all page content with the Inter font and a theme provider supporting system-based theming.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
        >
          {/* Structured Data for AI & Search Engines */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "SoftwareApplication",
                name: "Perspective",
                applicationCategory: "AIApplication",
                description:
                  "Perspective is an AI-powered tool that detects bias in text and generates alternative perspectives.",
                operatingSystem: "Web",
                url: "https://perspective-aossie.vercel.app/",
              }),
            }}
          />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}