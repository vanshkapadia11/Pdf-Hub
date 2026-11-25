import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt, clampQuality } from "@/lib/server/http";
import { loadImage, ImageError, resolveOutputFormat, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

/**
 * Binary-searches an encode quality whose output stays under targetKB.
 * Returns the best attempt even when the target cannot be reached.
 */
async function compressToTarget(buffer, format, targetBytes) {
  let low = 5;
  let high = 95;
  let best = null;

  // Fast exit when even maximum quality fits.
  const top = await encodeImage(buffer, format, 95);
  if (top.buffer.length <= targetBytes) return { ...top, reachedTarget: true };
  best = top;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const attempt = await encodeImage(buffer, format, mid);
    if (attempt.buffer.length <= targetBytes) {
      best = attempt;
      low = mid + 1; // try to spend the remaining budget on quality
    } else {
      high = mid - 1;
    }
  }

  return { ...best, reachedTarget: best.buffer.length <= targetBytes };
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    const mode = String(formData.get("mode") || "percentage");
    const buffer = Buffer.from(await file.arrayBuffer());
    const { metadata } = await loadImage(buffer);
    const outputFormat = resolveOutputFormat("auto", metadata.format);

    let encoded;
    let reachedTarget = true;

    if (mode === "filesize") {
      const targetKB = getInt(formData, "targetSize", 0);
      if (targetKB < 5) {
        return badRequest("Please enter a target size of at least 5 KB.");
      }
      const result = await compressToTarget(buffer, outputFormat, targetKB * 1024);
      encoded = result;
      reachedTarget = result.reachedTarget;
    } else if (mode === "percentage") {
      const quality = clampQuality(getInt(formData, "quality", 80));
      encoded = await encodeImage(buffer, outputFormat, quality);
    } else {
      return badRequest("Invalid compression mode.");
    }

    const result = binaryResponse(
      encoded.buffer,
      encoded.mime,
      downloadName(file, "-compressed", encoded.ext)
    );
    result.headers.set("X-Original-Size", String(buffer.length));
    result.headers.set("X-Compressed-Size", String(encoded.buffer.length));
    if (!reachedTarget) {
      result.headers.set(
        "X-Compression-Note",
        encodeURIComponent("The smallest achievable size for this image is larger than the requested target.")
      );
    }
    return result;
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("compress-image error:", error);
    return serverError("Failed to compress this image.");
  }
}
