/**
 * Parses "1-3,5" style page selections into a Set of 1-based page numbers.
 * Throws a descriptive Error for invalid input (mapped to HTTP 400 by callers).
 */
export function parsePageSelection(input) {
  if (typeof input !== "string" || !input.trim()) {
    throw new Error("No pages specified.");
  }
  const pages = new Set();
  for (const part of input.split(",")) {
    const trimmed = part.trim();
    if (!trimmed) continue;
    if (trimmed.includes("-")) {
      const [start, end] = trimmed.split("-").map((n) => Number(n.trim()));
      if (!Number.isInteger(start) || !Number.isInteger(end) || start < 1 || end < start) {
        throw new Error(`"${trimmed}" is not a valid page range.`);
      }
      for (let i = start; i <= end; i++) pages.add(i);
    } else {
      const n = Number(trimmed);
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`"${trimmed}" is not a valid page number.`);
      }
      pages.add(n);
    }
  }
  if (pages.size === 0) {
    throw new Error("No pages specified.");
  }
  return pages;
}
