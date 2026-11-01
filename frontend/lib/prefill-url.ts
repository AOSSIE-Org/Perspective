/**
 * Article URL passed in the `?url=` query parameter, or null if there is none.
 *
 * `URLSearchParams` already decodes the value once. Decoding it again would change
 * the article URL (e.g. `%2F` becomes `/`) and throws on a lone `%`, so it is used as-is.
 */
export function getPrefillUrl(search: string): string | null {
  return new URLSearchParams(search).get("url") || null;
}
