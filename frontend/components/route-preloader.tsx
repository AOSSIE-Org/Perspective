"use client";

import { useEffect } from "react";

export function RoutePreloader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Use requestIdleCallback or fallback to prefetch dynamic components in background
    const idleCallback =
      window.requestIdleCallback || ((cb: IdleRequestCallback) => setTimeout(cb, 1200));

    const id = idleCallback(() => {
      // Warm up dynamic chunks into browser module cache
      import("@/components/ui/bucket").catch(() => {});
      import("@/components/orbiting-tech-stack").catch(() => {});
      import("@/components/globe").catch(() => {});
    });

    return () => {
      if (typeof window !== "undefined" && window.cancelIdleCallback && typeof id === "number") {
        window.cancelIdleCallback(id);
      }
    };
  }, []);

  return null;
}

export default RoutePreloader;
