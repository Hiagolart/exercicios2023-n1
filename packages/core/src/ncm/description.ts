/**
 * Remove os marcadores de recuo ("-", "--", "---") que a nomenclatura oficial usa
 * para indicar profundidade. A profundidade já é dada pelo código.
 */
export function cleanNcmDescription(raw: string): string {
  return raw
    .replace(/^[\s\-–—]+/, "")
    .replace(/\s+/g, " ")
    .trim();
}
