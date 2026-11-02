import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import fc from "fast-check";
import { unlayerCss } from "@/lib/unlayer-css";
import { SUPPORT_STYLESHEET } from "@/config/support";

describe("unlayerCss", () => {
  it("unwraps layer blocks and keeps their rules in order", () => {
    expect(unlayerCss("@layer base{a{color:red}}@layer utilities{.x{margin:0}}")).toBe("a{color:red}.x{margin:0}");
  });

  it("drops layer-order statements", () => {
    expect(unlayerCss("@layer theme, base;@layer components;.x{margin:0}")).toBe(".x{margin:0}");
  });

  it("keeps nested at-rules inside a layer", () => {
    expect(unlayerCss("@layer properties{@supports (x:y){*{--a:0}}}")).toBe("@supports (x:y){*{--a:0}}");
    expect(unlayerCss("@media (min-width:40rem){@layer utilities{.sm{margin:0}}}")).toBe("@media (min-width:40rem){.sm{margin:0}}");
  });

  it("leaves braces and @layer inside strings and comments alone", () => {
    const css = `/* @layer x{ */.a::before{content:"}@layer y{"}.b{content:'\\'{'}`;
    expect(unlayerCss(css)).toBe(css);
  });

  it("does not touch other at-rules whose names start with layer", () => {
    expect(unlayerCss("@layered{a{b:c}}")).toBe("@layered{a{b:c}}");
  });

  it("drops an unterminated layer prelude", () => {
    expect(unlayerCss(".a{b:c}@layer base")).toBe(".a{b:c}");
  });

  it("property: CSS without layers comes back unchanged", () => {
    const rule = fc
      .tuple(fc.constantFrom(".a", "h1", "*:where(.sub-root)"), fc.constantFrom("color:red", "margin:0", 'content:"{"'))
      .map(([selector, declaration]) => `${selector}{${declaration}}`);
    fc.assert(
      fc.property(fc.array(rule), (rules) => {
        const css = rules.join("");
        expect(unlayerCss(css)).toBe(css);
      }),
    );
  });

  it("unlayers the support widget's stylesheet without losing a rule", () => {
    const css = fs.readFileSync(path.join(process.cwd(), SUPPORT_STYLESHEET), "utf8");
    const flat = unlayerCss(css);
    expect(flat).not.toMatch(/@layer\b/);
    expect(flat.split("{").length).toBe(flat.split("}").length);
    expect(flat.match(/\.sub-root/g)?.length).toBe(css.match(/\.sub-root/g)?.length);
  });
});
