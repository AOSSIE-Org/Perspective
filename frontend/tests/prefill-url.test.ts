import { describe, expect, it } from "vitest";
import { getPrefillUrl } from "@/lib/prefill-url";

describe("getPrefillUrl", () => {
  it("returns the article URL decoded exactly once", () => {
    const article = "https://example.org/news/a%2Fb?id=100%25";
    expect(getPrefillUrl(`?url=${encodeURIComponent(article)}`)).toBe(article);
  });

  it("does not throw on a URL that contains a lone percent sign", () => {
    expect(getPrefillUrl("?url=https%3A%2F%2Fexample.org%2Fa%25zz")).toBe("https://example.org/a%zz");
  });

  it("returns null when there is no url parameter", () => {
    expect(getPrefillUrl("")).toBeNull();
    expect(getPrefillUrl("?focus=1")).toBeNull();
    expect(getPrefillUrl("?url=")).toBeNull();
  });
});
