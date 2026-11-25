/**
 * Client-side helpers shared by every tool page: a single fetch wrapper
 * for the tool APIs plus formatting utilities.
 */

export interface ToolApiResult {
  ok: boolean;
  blob?: Blob;
  headers: Headers;
  filename?: string;
  error?: string;
}

/**
 * POSTs FormData to a tool endpoint. Successful responses are returned
 * as a Blob; failures are normalised into a readable error string.
 */
export async function callToolApi(endpoint: string, formData: FormData): Promise<ToolApiResult> {
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", body: formData });
  } catch {
    return {
      ok: false,
      headers: new Headers(),
      error: "Could not reach the server. Check your connection and try again.",
    };
  }

  if (!response.ok) {
    let message = `The request failed (HTTP ${response.status}).`;
    try {
      const data = await response.json();
      if (data && typeof data.error === "string") message = data.error;
    } catch {
      // Non-JSON error body — keep the generic message.
    }
    return { ok: false, headers: response.headers, error: message };
  }

  const blob = await response.blob();
  return {
    ok: true,
    blob,
    headers: response.headers,
    filename: filenameFromDisposition(response.headers),
  };
}

function filenameFromDisposition(headers: Headers): string | undefined {
  const disposition = headers.get("Content-Disposition") || "";
  const match = disposition.match(/filename="?([^";]+)"?/i);
  return match ? match[1] : undefined;
}

/** Reads an X-* info header (URL-encoded) from a tool response. */
export function infoHeader(headers: Headers, name: string): string | undefined {
  const raw = headers.get(name);
  if (!raw) return undefined;
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, exponent);
  return `${value >= 100 || exponent === 0 ? Math.round(value) : value.toFixed(1)} ${units[exponent]}`;
}

/** Reduction percentage between original and result sizes. */
export function sizeReduction(original: number, compressed: number): number {
  if (original <= 0) return 0;
  return Math.round(((original - compressed) / original) * 100);
}
