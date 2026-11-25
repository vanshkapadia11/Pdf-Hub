/**
 * Shared helpers for API route handlers: consistent JSON errors,
 * upload validation and binary responses.
 */
import { NextResponse } from "next/server";

export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024; // 50 MB

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

export function serverError(message = "Something went wrong while processing your file. Please try again.") {
  return NextResponse.json({ error: message }, { status: 500 });
}

/**
 * Returns an uploaded File from FormData, or null when the field is
 * missing/empty. Use `validateUpload` for the full guard chain.
 */
export function getUpload(formData: FormData, field: string): File | null {
  const value = formData.get(field);
  if (value instanceof File && value.size > 0) return value;
  return null;
}

/**
 * Validates presence + size of an upload and returns either
 * { file } or { response } with a ready-to-return error.
 */
export function validateUpload(
  formData: FormData,
  field: string,
  label: string,
  maxBytes = MAX_UPLOAD_BYTES
): { file: File; response?: never } | { file?: never; response: NextResponse } {
  const file = getUpload(formData, field);
  if (!file) {
    return { response: badRequest(`No ${label} provided. Please select a file and try again.`) };
  }
  if (file.size > maxBytes) {
    const maxMB = Math.round(maxBytes / (1024 * 1024));
    return { response: badRequest(`The ${label} is too large. Maximum file size is ${maxMB} MB.`) };
  }
  return { file };
}

/** Parses a positive integer form field with a fallback. */
export function getInt(formData: FormData, field: string, fallback: number): number {
  const raw = formData.get(field);
  if (raw === null) return fallback;
  const value = Number.parseInt(String(raw), 10);
  return Number.isFinite(value) ? value : fallback;
}

/** Parses a float form field, treating 0 as a real value. */
export function getFloat(formData: FormData, field: string, fallback: number): number {
  const raw = formData.get(field);
  if (raw === null) return fallback;
  const value = Number.parseFloat(String(raw));
  return Number.isFinite(value) ? value : fallback;
}

export function getBool(formData: FormData, field: string): boolean {
  const raw = formData.get(field);
  return raw === "true" || raw === "on" || raw === "1";
}

/**
 * Sniffs the real image type from magic bytes. Avoids trusting
 * client-supplied MIME types and the extra `file-type` dependency.
 */
export function sniffImageType(
  buffer: Buffer
): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
    return { mime: "image/png", ext: "png" };
  }
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) {
    return { mime: "image/gif", ext: "gif" };
  }
  if (
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }
  if (buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46) {
    return { mime: "image/webp", ext: "webp" };
  }
  // Minimal TIFF check (used by some scanners).
  if (
    (buffer[0] === 0x49 && buffer[1] === 0x49 && buffer[2] === 0x2a) ||
    (buffer[0] === 0x4d && buffer[1] === 0x4d && buffer[2] === 0x00)
  ) {
    return { mime: "image/tiff", ext: "tiff" };
  }
  return null;
}

/** Response for a generated binary file, with a proper download filename. */
export function binaryResponse(
  data: Buffer | Uint8Array,
  contentType: string,
  filename: string
) {
  const body = data instanceof Buffer ? data : Buffer.from(data);
  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}

/** Safe download filename derived from the upload name. */
export function downloadName(file: File, suffix: string, ext: string): string {
  const base = file.name
    ? file.name.replace(/\.[^.]+$/, "").replace(/[^\w\-. ]+/g, "_").slice(0, 60)
    : "document";
  return `${base || "document"}${suffix}.${ext}`;
}

/** Normalises quality (0-100) clamped to a sane range. */
export function clampQuality(value: number, min = 1, max = 100): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}
