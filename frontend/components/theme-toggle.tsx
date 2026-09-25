"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const t = useTranslations("ThemeToggle");

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className={`w-10 h-10 rounded-full bg-switcher-bg animate-pulse ${className}`} />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={t("toggleTheme")}
      className={`flex items-center justify-center w-10 h-10 rounded-full border border-brand-border bg-switcher-bg hover:bg-switcher-hover text-foreground shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer backdrop-blur-md ${className}`}
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-foreground transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 text-foreground transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}

export default ThemeToggle;
