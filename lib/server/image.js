/**
 * Shared sharp helpers for the image API routes.
 */
import sharp from "sharp";

export class ImageError extends Error {}

const SUPPORTED_INPUT = new Set(["jpeg", "png", "webp", "gif", "tiff", "avif", "svg"]);

/** Loads and validates an image, returning a fresh sharp pipeline + metadata. */
export async function loadImage(buffer) {
  let metadata;
  try {
    metadata = await sharp(buffer, { failOn: "error" }).metadata();
  } catch {
    throw new ImageError("This file could not be read as an image. It may be corrupted.");
  }
  if (!metadata.format || !SUPPORTED_INPUT.has(metadata.format)) {
    throw new ImageError(
      `Unsupported image format "${metadata.format || "unknown"}". Supported formats: JPG, PNG, WebP, GIF, TIFF and SVG.`
    );
  }
  if (!metadata.width || !metadata.height) {
    throw new ImageError("This image has no readable dimensions.");
  }
  return { metadata };
}

export const OUTPUT_FORMATS = ["auto", "png", "jpg", "webp"];

/** Resolves "auto" to the input format and normalises aliases. */
export function resolveOutputFormat(requested, inputFormat) {
  const format = String(requested || "auto").toLowerCase();
  if (format === "auto") {
    if (inputFormat === "jpeg" || inputFormat === "jpg") return "jpeg";
    if (inputFormat === "svg" || inputFormat === "gif" || inputFormat === "tiff" || inputFormat === "avif") return "png";
    return inputFormat;
  }
  if (format === "jpeg") return "jpeg";
  if (format === "jpg") return "jpeg";
  if (format === "png" || format === "webp") return format;
  throw new ImageError(`Unsupported output format "${format}". Use PNG, JPG or WebP.`);
}

/**
 * Encodes a buffer with sharp in the target format.
 * Returns { buffer, mime, ext }.
 */
export async function encodeImage(buffer, format, quality = 85) {
  let image = sharp(buffer);
  let mime;
  let ext;

  switch (format) {
    case "jpeg":
      image = image.jpeg({ quality, mozjpeg: true });
      mime = "image/jpeg";
      ext = "jpg";
      break;
    case "webp":
      image = image.webp({ quality });
      mime = "image/webp";
      ext = "webp";
      break;
    case "png":
      image = image.png({
        compressionLevel: 9,
        palette: quality < 95,
        quality,
      });
      mime = "image/png";
      ext = "png";
      break;
    default:
      throw new ImageError(`Unsupported output format "${format}".`);
  }

  try {
    return { buffer: await image.toBuffer(), mime, ext };
  } catch {
    throw new ImageError("The image could not be processed with the selected options.");
  }
}
