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

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const DPI = 300;
const CUT_GUIDE_WIDTH_PX = 3;

const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "image", "image", MAX_UPLOAD_BYTES);
    if (response) return response;

    const photoWidth = getInt(formData, "photoWidth", 35);
    const photoHeight = getInt(formData, "photoHeight", 45);
    const paperWidth = getInt(formData, "paperWidth", 210);
    const paperHeight = getInt(formData, "paperHeight", 297);
    const copies = getInt(formData, "copies", 8);

    if (photoWidth < 20 || photoWidth > 200 || photoHeight < 20 || photoHeight > 200) {
      return badRequest("Photo dimensions must be between 20mm and 200mm.");
    }
    if (paperWidth < 100 || paperWidth > 500 || paperHeight < 100 || paperHeight > 500) {
      return badRequest("Paper dimensions must be between 100mm and 500mm.");
    }
    if (copies < 1 || copies > 200) {
      return badRequest("Copies must be between 1 and 200.");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await loadImage(buffer);

    const photoWidthPx = mmToPx(photoWidth);
    const photoHeightPx = mmToPx(photoHeight);
    const paperWidthPx = mmToPx(paperWidth);
    const paperHeightPx = mmToPx(paperHeight);
    const padding = mmToPx(4); // gap between photos

    const maxPhotosX = Math.floor(
      (paperWidthPx + padding) / (photoWidthPx + padding)
    );
    const maxPhotosY = Math.floor(
      (paperHeightPx + padding) / (photoHeightPx + padding)
    );

    if (maxPhotosX < 1 || maxPhotosY < 1) {
      return badRequest(
        `A ${photoWidth}×${photoHeight}mm photo does not fit on ${paperWidth}×${paperHeight}mm paper. Try a smaller photo size.`
      );
    }

    // Single resized photo, cropped to the exact aspect ratio with the
    // subject kept in frame.
    const photo = await sharp(buffer)
      .resize({
        width: photoWidthPx,
        height: photoHeightPx,
        fit: "cover",
        position: sharp.strategy.attention,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .flatten({ background: "#ffffff" })
      .png()
      .toBuffer();

    const gridWidth = maxPhotosX * photoWidthPx + (maxPhotosX - 1) * padding;
    const gridHeight = maxPhotosY * photoHeightPx + (maxPhotosY - 1) * padding;
    const offsetX = Math.floor((paperWidthPx - gridWidth) / 2);
    const offsetY = Math.floor((paperHeightPx - gridHeight) / 2);

    const composites: sharp.OverlayOptions[] = [];
    const guideRects: string[] = [];
    let placed = 0;

    for (let y = 0; y < maxPhotosY && placed < copies; y++) {
      for (let x = 0; x < maxPhotosX && placed < copies; x++) {
        const left = offsetX + x * (photoWidthPx + padding);
        const top = offsetY + y * (photoHeightPx + padding);
        composites.push({ input: photo, left, top });
        guideRects.push(
          `<rect x="${left}" y="${top}" width="${photoWidthPx}" height="${photoHeightPx}" fill="none" stroke="#c8ccd4" stroke-width="${CUT_GUIDE_WIDTH_PX}"/>`
        );
        placed++;
      }
    }

    // Light cut guides around every photo so the sheet can be trimmed.
    const guides = Buffer.from(
      `<svg width="${paperWidthPx}" height="${paperHeightPx}" xmlns="http://www.w3.org/2000/svg">${guideRects.join("")}</svg>`
    );
    composites.push({ input: guides, left: 0, top: 0 });

    const sheet = await sharp({
      create: {
        width: paperWidthPx,
        height: paperHeightPx,
        channels: 3,
        background: { r: 255, g: 255, b: 255 },
      },
    })
      .composite(composites)
      .png({ compressionLevel: 9 })
      .toBuffer();

    const result = binaryResponse(
      sheet,
      "image/png",
      downloadName(file, "-photo-sheet", "png")
    );
    result.headers.set("X-Photos-Placed", String(placed));
    return result;
  } catch (error) {
    if (error instanceof ImageError) return badRequest(error.message);
    console.error("passport-photo-maker error:", error);
    return serverError("Failed to generate the photo sheet.");
  }
}
