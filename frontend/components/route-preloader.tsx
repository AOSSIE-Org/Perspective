"use client";

import { useEffect } from "react";

export function RoutePreloader() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const hasIdleCallback = typeof window.requestIdleCallback === "function";

    // Use requestIdleCallback or fallback to setTimeout to prefetch dynamic components in background
    const id = hasIdleCallback
      ? window.requestIdleCallback(() => {
          import("@/components/ui/bucket").catch(() => {});
          import("@/components/orbiting-tech-stack").catch(() => {});
          import("@/components/globe").catch(() => {});
        })
      : (setTimeout(() => {
          import("@/components/ui/bucket").catch(() => {});
          import("@/components/orbiting-tech-stack").catch(() => {});
          import("@/components/globe").catch(() => {});
        }, 1200) as unknown as number);

    return () => {
      if (typeof window !== "undefined") {
        if (hasIdleCallback && window.cancelIdleCallback) {
          window.cancelIdleCallback(id);
        } else {
          clearTimeout(id as unknown as ReturnType<typeof setTimeout>);
        }
      }
    };
  }, []);

  return null;
}

export default RoutePreloader;
