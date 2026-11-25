import sharp from "sharp";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt, getBool } from "@/lib/server/http";
import { loadImage, ImageError, resolveOutputFormat, encodeImage } from "@/lib/server/image";

export const runtime = "nodejs";

const ALLOWED_ROTATIONS = [0, 90, 180, 270];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image");
    if (response) return response;

    const rotate = getInt(formData, "rotate", 0);
    const flipH = getBool(formData, "flipH");
    const flipV = getBool(formData, "flipV");

    if (!ALLOWED_ROTATIONS.includes(rotate)) {
      return badRequest("Rotation must be 0, 90, 180 or 270 degrees.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const { metadata } = await loadImage(buffer);
    const outputFormat = resolveOutputFormat("auto", metadata.format);

    let pipeline = sharp(buffer);
    if (rotate !== 0) pipeline = pipeline.rotate(rotate);
    // sharp: flop() mirrors horizontally, flip() mirrors vertically.
    if (flipH) pipeline = pipeline.flop();
    if (flipV) pipeline = pipeline.flip();

    const processed = await pipeline.toBuffer();
    const encoded = await encodeImage(processed, outputFormat, 95);
    return binaryResponse(encoded.buffer, encoded.mime, downloadName(file, "-rotated", encoded.ext));
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("rotate-image error:", error);
    return serverError("Failed to rotate this image.");
  }
}
