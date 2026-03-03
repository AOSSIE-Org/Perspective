import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Sora } from "next/font/google"

const sora = Sora({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Perspective - AI-Powered Bias Detection",
  description: "Combat bias and one-sided narratives with AI-generated alternative perspectives.",
}

/**
 * Root layout component that sets up global HTML structure, font, and theming for the application.
 *
 * Wraps all page content with the Sora font.
 *
 * @param children - The content to be rendered within the layout.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={sora.className}>
        {children}
      </body>
    </html>
  )
}
