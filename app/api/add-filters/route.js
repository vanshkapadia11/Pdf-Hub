import sharp from "sharp";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getFloat } from "@/lib/server/http";
import { loadImage, ImageError, resolveOutputFormat, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    // getFloat keeps legitimately-sent 0 values working.
    const brightness = getFloat(formData, "brightness", 1);
    const contrast = getFloat(formData, "contrast", 1);
    const saturate = getFloat(formData, "saturate", 1);

    for (const [name, value] of [["brightness", brightness], ["contrast", contrast], ["saturate", saturate]]) {
      if (value < 0 || value > 3) {
        return badRequest(`${name} must be between 0 and 3.`);
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { metadata } = await loadImage(buffer);
    const outputFormat = resolveOutputFormat("auto", metadata.format);

    const processed = await sharp(buffer)
      .modulate({ brightness, saturation: saturate })
      .linear(contrast, -(128 * (contrast - 1)))
      .toBuffer();

    const encoded = await encodeImage(processed, outputFormat, 90);
    return binaryResponse(encoded.buffer, encoded.mime, downloadName(file, "-filtered", encoded.ext));
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("add-filters error:", error);
    return serverError("Failed to apply filters to this image.");
  }
}
