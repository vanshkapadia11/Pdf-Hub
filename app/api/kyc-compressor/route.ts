// ...existing code...
import { NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

// ...existing code...

/**
 * Iterative compression helper (same logic as before, adapted for App Router)
 */
async function iterativeCompress(
  inputBuffer: Buffer,
  targetSizeKB: number,
  format: "jpeg" | "png" | "webp"
): Promise<Buffer> {
  const targetSizeBytes = targetSizeKB * 1024;
  let currentBuffer = inputBuffer;

  if (format === "png") {
    // Convert to JPEG for lossy compression path
    currentBuffer = await sharp(inputBuffer).jpeg({ quality: 90 }).toBuffer();
    if (currentBuffer.length <= targetSizeBytes) return currentBuffer;
    format = "jpeg";
  }

  let low = 1;
  let high = 99;
  let bestBuffer: Buffer = currentBuffer;

  for (let i = 0; i < 7; i++) {
    if (low > high) break;
    const quality = Math.floor((low + high) / 2);
    const testBuffer = await sharp(inputBuffer).jpeg({ quality }).toBuffer();
    const size = testBuffer.length;
    if (size <= targetSizeBytes) {
      bestBuffer = testBuffer;
      low = quality + 1;
    } else {
      high = quality - 1;
    }
  }

  return bestBuffer;
}

/**
 * App Router POST handler — reads multipart formData from the Request,
 * converts the uploaded File to Buffer and returns binary image data.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const targetSizeRaw = formData.get("targetSizeKB")?.toString();
    const outputFormatRaw = (formData.get("outputFormat")?.toString() ||
      "jpeg") as "jpeg" | "png" | "webp";

    if (!file) {
      return NextResponse.json(
        { message: "No image file uploaded." },
        { status: 400 }
      );
    }

    const targetKB = parseInt(targetSizeRaw || "0", 10);
    if (isNaN(targetKB) || targetKB < 1) {
      return NextResponse.json(
        { message: "Invalid targetSizeKB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Run compression (iterativeCompress handles png->jpeg conversion)
    const compressed = await iterativeCompress(
      buffer,
      targetKB,
      outputFormatRaw === "webp" ? "jpeg" : outputFormatRaw
    );

    // Detect final mime
    const isJpeg = compressed.toString("hex").startsWith("ffd8");
    const mime = isJpeg ? "image/jpeg" : "image/png";
    const ext = isJpeg ? "jpg" : "png";

    return new NextResponse(new Uint8Array(compressed), {
      status: 200,
      headers: {
        "Content-Type": mime,
        "Content-Disposition": `attachment; filename="optimized-${targetKB}kb.${ext}"`,
      },
    });
  } catch (err) {
    console.error("KYC Compressor (App Router) Error:", err);
    return NextResponse.json(
      { message: "Internal Server Error during image optimization." },
      { status: 500 }
    );
  }
}
// ...existing code...
