import sharp from "sharp";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt, getBool, clampQuality } from "@/lib/server/http";
import { loadImage, ImageError, resolveOutputFormat, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

const MAX_DIMENSION = 12000;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    const method = String(formData.get("method") || "pixels");
    const quality = clampQuality(getInt(formData, "quality", 90));
    const lockAspect = getBool(formData, "lockAspect");

    const buffer = Buffer.from(await file.arrayBuffer());
    const { metadata } = await loadImage(buffer);
    const outputFormat = resolveOutputFormat(formData.get("outputFormat"), metadata.format);

    let resizeOptions;

    if (method === "pixels") {
      const width = getInt(formData, "width", 0);
      const height = getInt(formData, "height", 0);
      if (width < 1 && height < 1) {
        return badRequest("Please provide a width, a height, or both.");
      }
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        return badRequest(`Dimensions cannot exceed ${MAX_DIMENSION}px.`);
      }
      resizeOptions = {
        width: width > 0 ? width : undefined,
        height: height > 0 ? height : undefined,
        fit: lockAspect ? "inside" : "fill",
        withoutEnlargement: false,
      };
    } else if (method === "percentage") {
      const percentage = getInt(formData, "percentage", 0);
      if (percentage < 1 || percentage > 1000) {
        return badRequest("Percentage must be between 1 and 1000.");
      }
      resizeOptions = {
        width: Math.max(1, Math.round(metadata.width * (percentage / 100))),
        height: Math.max(1, Math.round(metadata.height * (percentage / 100))),
        fit: "fill",
      };
    } else {
      return badRequest("Invalid resize method.");
    }

    const resized = await sharp(buffer).resize(resizeOptions).toBuffer();
    const encoded = await encodeImage(resized, outputFormat, quality);
    const result = binaryResponse(
      encoded.buffer,
      encoded.mime,
      downloadName(file, "-resized", encoded.ext)
    );
    result.headers.set("X-Image-Width", String(resizeOptions.width ?? ""));
    return result;
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("resize-image error:", error);
    return serverError("Failed to resize this image.");
  }
}
