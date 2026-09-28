"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { ExternalLink } from "lucide-react";

const OrbitingTechStack = dynamic(() => import("@/components/orbiting-tech-stack"), {
  ssr: false,
  loading: () => <div className="w-full h-full min-h-[350px]" />,
});

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      className={className}
    >
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

export default function ContributePage() {
  const t = useTranslations("Contribute");

  return (
    <div className="relative w-full h-full max-w-5xl mx-auto px-4 pt-2 sm:pt-6 md:pt-10 lg:pt-12 pb-2 sm:pb-6 flex flex-col justify-between overflow-hidden select-none">
      {/* Header */}
      <div className="text-center shrink-0">
        {/* Token Badge (Exact same padding and properties as home page) */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-brand-border bg-card/60 text-foreground text-xs font-medium tracking-wide transition-all shadow-sm mb-2 sm:mb-4 md:mb-5">
          <span>{t("badge")}</span>
        </div>

        {/* Title (Exact same properties as home page title) */}
        <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground text-aura md:whitespace-nowrap pt-1 sm:pt-6 md:pt-8 mb-2 sm:mb-5 md:mb-8">
          {t("title")}
        </h1>

        {/* Action Buttons — shrink padding/text on mobile to prevent wrapping */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <a
            href="https://github.com/AOSSIE-Org/Perspective"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-[4px] bg-primary text-primary-foreground font-medium text-[11px] sm:text-sm shadow hover:opacity-95 transition-all transform hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
          >
            <GithubIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span>{t("githubBtn")}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70 shrink-0" />
          </a>

          <a
            href="https://discord.gg/hjUhu33uAn"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-[4px] border border-border/70 bg-card/60 hover:bg-card text-foreground font-medium text-[11px] sm:text-sm shadow transition-all transform hover:-translate-y-0.5 active:scale-[0.98] whitespace-nowrap"
          >
            <DiscordIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#5865F2] shrink-0" />
            <span>{t("discordBtn")}</span>
            <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 opacity-70 shrink-0" />
          </a>
        </div>
      </div>

      {/* Orbiting Concentric Tech Stack Stage */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden my-auto">
        <OrbitingTechStack />
      </div>
    </div>
  );
}
