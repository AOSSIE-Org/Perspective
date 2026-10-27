import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { apiUrl, API_BASE_URL, API_ENDPOINTS, API_TIMEOUT_MS, DEFAULT_API_BASE_URL, type ApiEndpoint } from "@/config/api";
import { PRESET_TOPICS, TOPICS_CURATED_AT, TOPIC_MAX_AGE_DAYS } from "@/config/preset-topics";
import { cn } from "@/lib/utils";

const endpoints = Object.keys(API_ENDPOINTS) as ApiEndpoint[];

describe("backend API config", () => {
  it("defaults to the Hugging Face Space over HTTPS", () => {
    expect(API_BASE_URL).toBe(DEFAULT_API_BASE_URL);
    expect(new URL(API_BASE_URL).protocol).toBe("https:");
  });

  it("builds the endpoint URLs used by the analyze flow and chat", () => {
    expect(apiUrl("process")).toBe(`${DEFAULT_API_BASE_URL}/api/process`);
    expect(apiUrl("bias")).toBe(`${DEFAULT_API_BASE_URL}/api/bias`);
    expect(apiUrl("chat")).toBe(`${DEFAULT_API_BASE_URL}/api/chat`);
  });

  it("gives analysis a longer timeout than chat", () => {
    expect(API_TIMEOUT_MS.analysis).toBeGreaterThan(API_TIMEOUT_MS.chat);
  });

  it("property: any base URL with any number of trailing slashes yields exactly one slash before /api", () => {
    fc.assert(
      fc.property(fc.webUrl({ withQueryParameters: false, withFragments: false }), fc.nat({ max: 3 }), fc.constantFrom(...endpoints), (base, slashes, endpoint) => {
        const url = apiUrl(endpoint, base.replace(/\/+$/, "") + "/".repeat(slashes));
        expect(url.endsWith(API_ENDPOINTS[endpoint])).toBe(true);
        expect(url).not.toMatch(/[^:]\/\/api\//);
      }),
    );
  });
});

describe("preset topics", () => {
  const daysBetween = (a: string, b: string) => (Date.parse(b) - Date.parse(a)) / 86_400_000;

  it("has unique ids", () => {
    const ids = PRESET_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(PRESET_TOPICS.map((t) => [t.id, t] as const))("%s links an HTTPS source published before it was curated", (_, topic) => {
    expect(new URL(topic.url).protocol).toBe("https:");
    expect(daysBetween(topic.publishedAt, topic.curatedAt)).toBeGreaterThanOrEqual(0);
    expect(topic.curatedAt <= TOPICS_CURATED_AT).toBe(true);
  });

  it("only ships topics that are fresh relative to the curation date", () => {
    for (const topic of PRESET_TOPICS) {
      expect(daysBetween(topic.publishedAt, TOPICS_CURATED_AT), topic.id).toBeLessThanOrEqual(TOPIC_MAX_AGE_DAYS);
    }
  });

  it("has a complete, in-range bias analysis for every topic", () => {
    for (const topic of PRESET_TOPICS) {
      expect(topic.biasScore.bias_score, topic.id).toBeGreaterThanOrEqual(0);
      expect(topic.biasScore.bias_score, topic.id).toBeLessThanOrEqual(100);
      expect(topic.biasScore.explanation.trim(), topic.id).not.toBe("");
      expect(topic.analysisResult.perspective.trim(), topic.id).not.toBe("");
      for (const fact of topic.analysisResult.facts) {
        expect(fact.claim.trim(), topic.id).not.toBe("");
      }
    }
  });
});

describe("cn", () => {
  it("merges conditional classes and lets later Tailwind utilities win", () => {
    expect(cn("px-2", false && "hidden", "px-4")).toBe("px-4");
    expect(cn("text-sm", ["font-bold", { underline: true, italic: false }])).toBe("text-sm font-bold underline");
  });
});
