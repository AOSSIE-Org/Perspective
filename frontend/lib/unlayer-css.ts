/**
 * Moves every rule out of its cascade layer: `@layer name { rules }` becomes `rules`, and layer-order
 * statements (`@layer a, b;`) are dropped. The site's Tailwind v3 styles are unlayered, and unlayered rules
 * always beat layered ones, so a Tailwind v4 stylesheet only keeps its intended precedence once it is
 * unlayered too. Quoted strings and comments are copied as they are.
 */
export function unlayerCss(css: string): string {
  let out = "";
  // One entry per open block: true for a layer, whose braces are dropped
  const blocks: boolean[] = [];
  let i = 0;

  while (i < css.length) {
    const char = css[i];

    if (char === '"' || char === "'") {
      const end = endOfString(css, i);
      out += css.slice(i, end);
      i = end;
    } else if (css.startsWith("/*", i)) {
      const close = css.indexOf("*/", i + 2);
      const end = close === -1 ? css.length : close + 2;
      out += css.slice(i, end);
      i = end;
    } else if (css.startsWith("@layer", i) && !/[\w-]/.test(css[i + "@layer".length] ?? "")) {
      // Either a block (`@layer name {`) or a statement (`@layer a, b;`); both lose the prelude
      const brace = css.indexOf("{", i);
      const semicolon = css.indexOf(";", i);
      if (semicolon !== -1 && (brace === -1 || semicolon < brace)) {
        i = semicolon + 1;
      } else if (brace === -1) {
        // An unterminated prelude has nothing left to keep
        i = css.length;
      } else {
        blocks.push(true);
        i = brace + 1;
      }
    } else if (char === "{") {
      blocks.push(false);
      out += char;
      i += 1;
    } else if (char === "}") {
      if (!blocks.pop()) out += char;
      i += 1;
    } else {
      out += char;
      i += 1;
    }
  }

  return out;
}

/** Index just past the quoted string that starts at `start`, honouring backslash escapes. */
function endOfString(css: string, start: number): number {
  const quote = css[start];
  let i = start + 1;
  while (i < css.length && css[i] !== quote) {
    i += css[i] === "\\" ? 2 : 1;
  }
  return Math.min(i + 1, css.length);
}
