"use client"

import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"

export default function Header() {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link href="/" className="font-bold text-lg">
          Perspective
        </Link>

        <nav className="flex items-center gap-4">
          <Link href="/analyze">Analyze</Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  )
}