import fc from "fast-check";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { LegalDocument, parseLegalMarkdown, resolveLegalHref } from "@/lib/legal-markdown";

const links = { privacy: "/en/privacy", terms: "/en/terms" };

describe("parseLegalMarkdown", () => {
  it("splits headings, paragraphs and lists", () => {
    const blocks = parseLegalMarkdown("# Title\n\nOne\ntwo\n\n## Part\n\n* a\n* b\n  continued\n\nEnd");
    expect(blocks).toEqual([
      { type: "heading", level: 1, text: "Title" },
      { type: "paragraph", text: "One two" },
      { type: "heading", level: 2, text: "Part" },
      { type: "list", items: ["a", "b continued"] },
      { type: "paragraph", text: "End" },
    ]);
  });

  it("handles Windows line endings", () => {
    expect(parseLegalMarkdown("## A\r\n\r\ntext\r\n")).toEqual([
      { type: "heading", level: 2, text: "A" },
      { type: "paragraph", text: "text" },
    ]);
  });
});

describe("resolveLegalHref", () => {
  it("maps the legal files to site pages", () => {
    expect(resolveLegalHref("PRIVACY.md", links)).toBe("/en/privacy");
    expect(resolveLegalHref("./TERMS.md", links)).toBe("/en/terms");
  });

  it("keeps http(s) and mailto links and drops unsafe ones", () => {
    expect(resolveLegalHref("https://example.org", links)).toBe("https://example.org");
    expect(resolveLegalHref("mailto:contact@aossie.org", links)).toBe("mailto:contact@aossie.org");
    expect(resolveLegalHref("javascript:alert(1)", links)).toBeNull();
    expect(resolveLegalHref("other.md", links)).toBeNull();
  });

  it("keeps site paths but drops protocol-relative links to other hosts", () => {
    expect(resolveLegalHref("/support", links)).toBe("/support");
    expect(resolveLegalHref("#contact", links)).toBe("#contact");
    expect(resolveLegalHref("//example.org", links)).toBeNull();
    expect(resolveLegalHref("/\\example.org", links)).toBeNull();
  });

  it("property: any resolved href is a legal page, http(s), mailto, a fragment or a single-slash path", () => {
    const allowed = /^(https?:|mailto:|#|\/(?![/\\]))/i;
    const href = fc.oneof(
      fc.string(),
      fc.webUrl(),
      fc.string().map((s) => "/" + s),
      fc.string().map((s) => "//" + s),
      fc.string().map((s) => "/\\" + s),
      fc.constantFrom("PRIVACY.md", "./TERMS.md", "javascript:alert(1)", "data:x", "//example.org", "/\\example.org"),
    );
    fc.assert(
      fc.property(href, (input) => {
        const out = resolveLegalHref(input, links);
        if (out === null || out === links.privacy || out === links.terms) return;
        expect(out).toMatch(allowed);
        expect(out.startsWith("//") || out.startsWith("/\\")).toBe(false);
      }),
    );
  });
});

describe("LegalDocument", () => {
  it("renders inline formatting, safe links and English language markup", () => {
    const html = renderToStaticMarkup(
      <LegalDocument
        links={links}
        source={"# Privacy\n\n**Bold** `theme` [Terms](TERMS.md) [GitHub](https://github.com) [x](javascript:alert(1))"}
      />,
    );
    expect(html).toContain('<div lang="en">');
    expect(html).toContain("<h1>Privacy</h1>");
    expect(html).toContain("<strong>Bold</strong>");
    expect(html).toContain("<code>theme</code>");
    expect(html).toContain('<a href="/en/terms">Terms</a>');
    expect(html).toContain('<a href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub</a>');
    expect(html).not.toContain("javascript:");
  });
});
