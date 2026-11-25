import sharp from "sharp";
import {
  validateUpload,
  binaryResponse,
  downloadName,
  badRequest,
  serverError,
  getInt,
} from "@/lib/server/http";
import { loadImage, ImageError } from "@/lib/server/image";

export const runtime = "nodejs";

type TargetFormat = "jpeg" | "png" | "webp";

const MAX_KYC_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

async function encodeFor(buffer: Buffer, format: TargetFormat, quality: number): Promise<Buffer> {
  switch (format) {
    case "jpeg":
      return sharp(buffer).jpeg({ quality, mozjpeg: true }).toBuffer();
    case "webp":
      return sharp(buffer).webp({ quality }).toBuffer();
    case "png":
      return sharp(buffer)
        .png({ compressionLevel: 9, palette: true, quality })
        .toBuffer();
  }
}

/**
 * Binary-searches an encoding whose size stays under the target.
 * Returns the best attempt plus whether the target was reached.
 */
async function compressToTarget(
  buffer: Buffer,
  format: TargetFormat,
  targetBytes: number
): Promise<{ buffer: Buffer; reachedTarget: boolean }> {
  // If the maximum-quality encode already fits, keep the best quality.
  const top = await encodeFor(buffer, format, 95);
  if (top.length <= targetBytes) return { buffer: top, reachedTarget: true };

  let low = 5;
  let high = 95;
  let best = top;
  let reached = false;

  while (low <= high) {
    const quality = Math.floor((low + high) / 2);
    const attempt = await encodeFor(buffer, format, quality);
    if (attempt.length <= targetBytes) {
      best = attempt;
      reached = true;
      low = quality + 1; // spend the remaining budget on quality
    } else {
      high = quality - 1;
    }
  }
  return { buffer: best, reachedTarget: reached };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image", MAX_KYC_UPLOAD_BYTES);
    if (response) return response;

    const targetKB = getInt(formData, "targetSizeKB", 100);
    if (targetKB < 5 || targetKB > 2048) {
      return badRequest("Target size must be between 5 KB and 2048 KB.");
    }

    const rawFormat = String(formData.get("outputFormat") || "jpeg").toLowerCase();
    if (!["jpeg", "png", "webp"].includes(rawFormat)) {
      return badRequest("Invalid output format. Supported formats: JPEG, PNG and WebP.");
    }
    const format = rawFormat as TargetFormat;

    const buffer = Buffer.from(await file.arrayBuffer());
    await loadImage(buffer);

    // Flatten transparency: KYC documents need an opaque background.
    const opaque = await sharp(buffer).flatten({ background: "#ffffff" }).toBuffer();

    const { buffer: compressed, reachedTarget } = await compressToTarget(
      opaque,
      format,
      targetKB * 1024
    );

    const mime = format === "jpeg" ? "image/jpeg" : `image/${format}`;
    const ext = format === "jpeg" ? "jpg" : format;
    const result = binaryResponse(
      compressed,
      mime,
      downloadName(file, `-${targetKB}kb`, ext)
    );
    result.headers.set("X-Original-Size", String(buffer.length));
    result.headers.set("X-Compressed-Size", String(compressed.length));
    if (!reachedTarget) {
      result.headers.set(
        "X-Compression-Note",
        encodeURIComponent(
          "This image cannot be compressed to the requested size without becoming unusable; the closest achievable size was returned."
        )
      );
    }
    return result;
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("kyc-compressor error:", error);
    return serverError("Failed to optimize this image.");
  }
}
