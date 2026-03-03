/**
 * Central configuration – reads from Next.js public env vars
 * with sensible local-dev defaults.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5555";