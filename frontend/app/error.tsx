"use client";

import { useEffect } from "react";

interface ErrorProps {
    error: Error & { digest?: string };
    reset: () => void;
}

/**
 * Next.js App Router error boundary.
 * Renders a sanitized, user-facing error page.
 * Stack traces and internal paths are NEVER exposed to the client.
 */
export default function Error({ error, reset }: ErrorProps) {
    useEffect(() => {
        // Log detailed error information server-side / to your monitoring tool only.
        // Never surface `error.stack` or `error.message` directly in the UI.
        console.error("[Error boundary]", error);
    }, [error]);

    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                gap: "1rem",
                fontFamily: "sans-serif",
                padding: "2rem",
                textAlign: "center",
            }}
        >
            <h1 style={{ fontSize: "2rem", fontWeight: 700 }}>
                Something went wrong
            </h1>
            <p style={{ color: "#666", maxWidth: "480px" }}>
                An unexpected error occurred. Please try again, or contact support if
                the problem persists.
            </p>
            {/* Expose only the opaque digest (safe, no internal details) */}
            {error.digest && (
                <p style={{ fontSize: "0.8rem", color: "#999" }}>
                    Error ID: {error.digest}
                </p>
            )}
            <button
                onClick={reset}
                style={{
                    marginTop: "1rem",
                    padding: "0.6rem 1.4rem",
                    borderRadius: "6px",
                    border: "none",
                    background: "#0070f3",
                    color: "#fff",
                    cursor: "pointer",
                    fontSize: "1rem",
                }}
            >
                Try again
            </button>
        </div>
    );
}
