import sharp from "sharp";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt } from "@/lib/server/http";
import { loadImage, ImageError, resolveOutputFormat, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    const x = getInt(formData, "x", -1);
    const y = getInt(formData, "y", -1);
    const width = getInt(formData, "width", 0);
    const height = getInt(formData, "height", 0);

    if ([x, y, width, height].some((v) => Number.isNaN(v)) || x < 0 || y < 0 || width <= 0 || height <= 0) {
      return badRequest("Invalid crop area: x/y must be 0 or greater and width/height must be positive.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { metadata } = await loadImage(buffer);
    const format = resolveOutputFormat(formData.get("outputFormat"), metadata.format);

    // Reject crop areas that fall outside the image instead of silently
    // shrinking them — the user asked for a specific rectangle.
    if (x + width > metadata.width || y + height > metadata.height) {
      return badRequest(
        `The crop area (x: ${x}, y: ${y}, ${width}×${height}px) falls outside the ${metadata.width}×${metadata.height}px image.`
      );
    }

    const cropped = await sharp(buffer)
      .extract({ left: x, top: y, width, height })
      .toBuffer();

    const encoded = await encodeImage(cropped, format, 90);
    return binaryResponse(encoded.buffer, encoded.mime, downloadName(file, "-cropped", encoded.ext));
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    const extractFailed = error?.message?.includes("extract");
    if (extractFailed) return badRequest("The crop area is outside the image bounds.");
    console.error("crop-image error:", error);
    return serverError("Failed to crop this image.");
  }
}
