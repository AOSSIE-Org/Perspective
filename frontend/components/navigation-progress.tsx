"use client";

import { useEffect, useState, useRef } from "react";
import { usePathname } from "@/i18n/navigation";

export function NavigationProgress() {
  const pathname = usePathname();
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentPathRef = useRef(pathname);

  // When pathname changes, complete progress and fade out
  useEffect(() => {
    if (currentPathRef.current !== pathname) {
      currentPathRef.current = pathname;
      setProgress(100);
      const timer = setTimeout(() => {
        setLoading(false);
        setProgress(0);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [pathname]);

  // Intercept click on internal links to provide 0ms instant loading feedback
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Ignore external, hash-only, target="_blank", or modifier clicks
      if (
        anchor.target === "_blank" ||
        anchor.rel?.includes("external") ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey ||
        href.startsWith("http") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      // If navigating to a different page, start instant progress animation
      const cleanHref = href.split("?")[0].split("#")[0];
      const cleanCurrent = window.location.pathname.split("?")[0].split("#")[0];

      if (cleanHref !== cleanCurrent) {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setLoading(true);
        setProgress(28);

        // Advance progress smoothly to indicate active loading
        progressTimerRef.current = setInterval(() => {
          setProgress((prev) => {
            if (prev >= 88) {
              if (progressTimerRef.current) clearInterval(progressTimerRef.current);
              return 88;
            }
            return prev + (prev < 60 ? 16 : 6);
          });
        }, 120);
      }
    };

    document.addEventListener("click", handleDocumentClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleDocumentClick, { capture: true });
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, []);

  if (!loading && progress === 0) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed top-0 left-0 right-0 z-[9999] pointer-events-none h-[3px] overflow-hidden"
    >
      <div
        className="h-full bg-primary transition-all ease-out duration-200 shadow-[0_0_8px_var(--ring)]"
        style={{
          width: `${progress}%`,
          opacity: progress === 100 ? 0 : 1,
          transitionProperty: "width, opacity",
          transitionDuration: progress === 100 ? "250ms, 250ms" : "200ms, 0ms",
        }}
      />
    </div>
  );
}

export default NavigationProgress;
