import sharp from "sharp";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt, clampQuality } from "@/lib/server/http";
import { loadImage, ImageError, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    const format = String(formData.get("format") || "").toLowerCase();
    if (!["png", "jpg", "webp"].includes(format)) {
      return badRequest("Invalid output format. Supported formats: PNG, JPG and WebP.");
    }
    const quality = clampQuality(getInt(formData, "quality", 90));

    const buffer = Buffer.from(await file.arrayBuffer());
    await loadImage(buffer);

    // JPEG has no alpha channel: give transparent areas a white background
    // instead of the black sharp would produce.
    const prepared = format === "jpg"
      ? await sharp(buffer).flatten({ background: "#ffffff" }).toBuffer()
      : buffer;

    const encoded = await encodeImage(prepared, format === "jpg" ? "jpeg" : format, quality);
    return binaryResponse(
      encoded.buffer,
      encoded.mime,
      downloadName(file, `-converted`, encoded.ext)
    );
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("convert-image error:", error);
    return serverError("Failed to convert this image.");
  }
}
