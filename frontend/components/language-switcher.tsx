"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { useRouter, usePathname } from "@/i18n/navigation";
import { languages } from "@/config/languages";
import { useLocale } from "next-intl";
import { Globe, ChevronUp } from "lucide-react";

export default function LanguageSwitcher({ className = "" }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (newLocale: string) => {
    setIsOpen(false);
    startTransition(() => {
      router.replace(pathname, { locale: newLocale });
    });
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentLang = languages.find((l) => l.code === locale) || languages[0];

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isPending}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-border bg-switcher-bg hover:bg-switcher-hover text-foreground text-xs md:text-sm font-medium shadow-sm transition-all focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer backdrop-blur-md"
      >
        <Globe className="w-3.5 h-3.5 text-foreground-muted" />
        <span className="uppercase">{currentLang.code}</span>
        <ChevronUp className={`w-3.5 h-3.5 text-foreground-muted transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-36 rounded-xl border border-border bg-card shadow-xl p-1 z-50 animate-fade-in backdrop-blur-lg">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`w-full text-left px-3 py-2 text-xs md:text-sm rounded-lg flex items-center justify-between transition-colors ${
                lang.code === locale
                  ? "bg-primary text-primary-foreground font-semibold"
                  : "text-foreground hover:bg-secondary/60"
              }`}
            >
              <span>{lang.name}</span>
              <span className="text-xs opacity-75">{lang.localName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
