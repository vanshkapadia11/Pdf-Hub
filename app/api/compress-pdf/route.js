import { PDFDocument } from "pdf-lib";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt, getFloat, getBool, clampQuality } from "@/lib/server/http";
import { rasterizeToPdf, PdfError } from "@/lib/server/pdf";
import { recompressPdfImages } from "@/lib/server/pdf-images";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * First-line compression: re-encode embedded images and keep text as sharp
 * vectors. Per compression level (JPEG quality + optional resolution cap).
 */
const IMAGE_PRESETS = {
  low: { quality: 90, maxDimension: null },
  medium: { quality: 75, maxDimension: null },
  high: { quality: 60, maxDimension: 1800 },
  maximum: { quality: 45, maxDimension: 1400 },
};

/** Fallback: rasterize whole pages (scale + JPEG quality per level). */
const RASTER_PRESETS = {
  low: { scale: 1.75, quality: 90 },
  medium: { scale: 1.5, quality: 75 },
  high: { scale: 1.25, quality: 60 },
  maximum: { scale: 1.0, quality: 45 },
};

/**
 * Attempts for target-size mode, from best quality to most aggressive.
 * Image passes first (sharper text), rasterization as the deep fallback.
 */
const TARGET_ATTEMPTS = [
  { image: { quality: 80, maxDimension: null } },
  { image: { quality: 60, maxDimension: 1800 } },
  { raster: { scale: 1.25, quality: 55 } },
  { raster: { scale: 1.0, quality: 45 } },
  { raster: { scale: 0.85, quality: 40 } },
  { raster: { scale: 0.75, quality: 40 } },
  { raster: { scale: 0.65, quality: 32 } },
];

/** The image pass must save at least 5% to beat the rasterization fallback. */
const IMAGE_PASS_MIN_RATIO = 0.95;

/**
 * Runs recompressPdfImages but never lets a parse failure kill the request:
 * damaged files fall through to the rasterize path, which reports the real
 * problem; encrypted files rethrow so the route answers with a clear message.
 */
async function tryRecompressImages(buffer, options) {
  try {
    return await recompressPdfImages(buffer, options);
  } catch (error) {
    if (error?.message?.toLowerCase().includes("encrypt")) throw error;
    return null;
  }
}

/** Lossless pass: strip metadata and re-save with object streams. */
async function losslessOptimize(buffer) {
  const pdfDoc = await PDFDocument.load(buffer);
  pdfDoc.setTitle("");
  pdfDoc.setAuthor("");
  pdfDoc.setSubject("");
  pdfDoc.setProducer("PDF Hub");
  pdfDoc.setCreator("PDF Hub");
  pdfDoc.setKeywords([]);
  return pdfDoc.save({ useObjectStreams: true });
}

/**
 * Same, but a parse failure turns into the friendly "corrupted" 400 the
 * other modes already produce (encrypted files rethrow for the route's
 * password message).
 */
async function losslessOptimizeOr400(buffer) {
  try {
    return await losslessOptimize(buffer);
  } catch (error) {
    if (error?.message?.toLowerCase().includes("encrypt")) throw error;
    throw new PdfError("This file is not a valid PDF or is corrupted.");
  }
}

function imagePassNote(touched, quality, maxDimension) {
  if (touched === 0) {
    return "No recompressible embedded images were found, but the internal PDF structure was cleaned up.";
  }
  return `Embedded images were re-compressed at ${quality}% quality${
    maxDimension ? ` and capped at ${maxDimension}px resolution` : ""
  }, keeping all text as sharp vectors.`;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const compressionType = String(formData.get("compressionType") || "preset");
    const originalBuffer = Buffer.from(await file.arrayBuffer());
    const originalSize = originalBuffer.length;

    let compressed;
    let note;

    if (compressionType === "custom") {
      const quality = clampQuality(getInt(formData, "customQuality", 75));
      const downsample = getBool(formData, "downsampleImages");
      const maxDimension = downsample ? 1600 : null;
      const imageResult = await tryRecompressImages(originalBuffer, { quality, maxDimension });
      if (imageResult && imageResult.bytes.length < originalSize * IMAGE_PASS_MIN_RATIO) {
        compressed = imageResult.bytes;
        note = imagePassNote(imageResult.touched, quality, maxDimension);
      } else {
        compressed = await rasterizeToPdf(originalBuffer, {
          scale: downsample ? 1.25 : 1.75,
          quality,
        });
        note = `Pages were re-encoded as images at ${quality}% quality${
          downsample ? " with reduced resolution" : ""
        }.`;
      }
    } else if (compressionType === "target") {
      const targetMB = getFloat(formData, "targetSize", 1);
      if (targetMB < 0.05) {
        return badRequest("Please enter a target size of at least 0.05 MB.");
      }
      const targetBytes = targetMB * 1024 * 1024;
      if (targetBytes >= originalSize) {
        compressed = await losslessOptimizeOr400(originalBuffer);
        note = "The file is already smaller than the target size, so only metadata was cleaned up.";
      } else {
        note = "Target size could not be reached; the closest achievable size was returned.";
        for (const attempt of TARGET_ATTEMPTS) {
          if (attempt.image) {
            const imageResult = await tryRecompressImages(originalBuffer, attempt.image);
            compressed = imageResult ? imageResult.bytes : originalBuffer;
            if (compressed.length <= targetBytes) {
              note = `Target reached by re-compressing embedded images at ${attempt.image.quality}% quality.`;
              break;
            }
          } else {
            compressed = await rasterizeToPdf(originalBuffer, attempt.raster);
            if (compressed.length <= targetBytes) {
              note = `Target reached by re-encoding pages as images at ${attempt.raster.quality}% quality.`;
              break;
            }
          }
        }
      }
    } else {
      const level = String(formData.get("compressionLevel") || "medium");
      const imagePreset = IMAGE_PRESETS[level] || IMAGE_PRESETS.medium;
      const rasterPreset = RASTER_PRESETS[level] || RASTER_PRESETS.medium;
      const imageResult = await tryRecompressImages(originalBuffer, imagePreset);
      if (imageResult && imageResult.bytes.length < originalSize * IMAGE_PASS_MIN_RATIO) {
        compressed = imageResult.bytes;
        note = imagePassNote(imageResult.touched, imagePreset.quality, imagePreset.maxDimension);
      } else {
        compressed = await rasterizeToPdf(originalBuffer, rasterPreset);
        note = `Pages were re-encoded as images at ${rasterPreset.quality}% quality to shrink the file.`;
      }
    }

    // Compression can still grow already-optimized files; fall back to a
    // lossless pass (and finally the untouched original) so output is never
    // larger than the upload.
    let finalBuffer = compressed;
    if (finalBuffer.length >= originalSize) {
      const lossless = await losslessOptimize(originalBuffer);
      if (lossless.length < originalSize) {
        finalBuffer = lossless;
        note =
          "This PDF is already efficiently encoded, so only metadata was removed and the internal structure was cleaned up.";
      } else {
        finalBuffer = originalBuffer;
        note = "This PDF is already fully optimized — no further size reduction is possible without visible quality loss.";
      }
    }

    const result = binaryResponse(
      finalBuffer,
      "application/pdf",
      downloadName(file, "-compressed", "pdf")
    );
    result.headers.set("X-Original-Size", String(originalSize));
    result.headers.set("X-Compressed-Size", String(finalBuffer.length));
    result.headers.set("X-Compression-Note", encodeURIComponent(note));
    return result;
  } catch (error) {
    if (error instanceof PdfError) return badRequest(error.message);
    const encrypted = error?.message?.toLowerCase().includes("encrypt");
    if (encrypted) {
      return badRequest("This PDF is password protected. Please remove the password first.");
    }
    console.error("compress-pdf error:", error);
    return serverError();
  }
}
