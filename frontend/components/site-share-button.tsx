"use client";

import { useEffect, useRef } from "react";
import { Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import type SocialShareButton from "@aossie-org/social-share-button";
import { SHARE_PLATFORMS } from "@/config/support";
import "@aossie-org/social-share-button/src/social-share-button.css";

/** Navbar icon button that opens the share dialog for the current page. */
export function SiteShareButton({ className }: { className: string }) {
  const t = useTranslations("Share");
  const { resolvedTheme } = useTheme();
  const containerRef = useRef<HTMLSpanElement>(null);
  const instanceRef = useRef<SocialShareButton | null>(null);
  const theme = resolvedTheme === "light" ? "light" : "dark";
  const share = t("share");
  const close = t("close");
  const copy = t("copy");
  const copied = t("copied");
  const copyFailed = t("copyFailed");
  const urlLabel = t("urlLabel");

  // The dialog bakes its theme in when built, so it is rebuilt when the theme or language changes
  useEffect(() => {
    let cancelled = false;
    let instance: SocialShareButton | null = null;

    import("@aossie-org/social-share-button").then((mod) => {
      // The package is a classic script: bundlers expose it as the default export, or only on `window`
      const Share = mod.default ?? window.SocialShareButton;
      if (cancelled || !Share || !containerRef.current) return;
      instance = new Share({
        container: containerRef.current,
        showButton: false,
        platforms: SHARE_PLATFORMS,
        theme,
        labels: { share, close, copy, copied, copyFailed, urlLabel },
      });
      instanceRef.current = instance;
    });

    return () => {
      cancelled = true;
      instance?.destroy();
      instanceRef.current = null;
    };
  }, [theme, share, close, copy, copied, copyFailed, urlLabel]);

  const openShare = () => {
    const instance = instanceRef.current;
    if (!instance) return;
    instance.updateOptions({ url: window.location.href, title: document.title });
    instance.openModal();
  };

  return (
    <>
      <span ref={containerRef} hidden />
      <button type="button" onClick={openShare} aria-label={t("trigger")} title={t("trigger")} className={className}>
        <Share2 aria-hidden="true" className="size-[18px]" />
      </button>
    </>
  );
}

export default SiteShareButton;
