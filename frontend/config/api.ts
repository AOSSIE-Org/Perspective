/** Perspective backend (FastAPI on Hugging Face Spaces). Override with NEXT_PUBLIC_API_URL at build time. */
export const DEFAULT_API_BASE_URL = "https://thunder1245-perspective-backend.hf.space";

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, "");

export const API_ENDPOINTS = {
  process: "/api/process",
  bias: "/api/bias",
  chat: "/api/chat",
} as const;

export type ApiEndpoint = keyof typeof API_ENDPOINTS;

/** Article analysis runs scraping, RAG and LLM calls, so it gets a long timeout; chat replies are short. */
export const API_TIMEOUT_MS = {
  analysis: 90_000,
  chat: 30_000,
} as const;

export function apiUrl(endpoint: ApiEndpoint, baseUrl: string = API_BASE_URL): string {
  return `${baseUrl.replace(/\/+$/, "")}${API_ENDPOINTS[endpoint]}`;
}
