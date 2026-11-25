import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { badRequest, serverError, sniffImageType, binaryResponse, downloadName } from "@/lib/server/http";

export const runtime = "nodejs";

// A4 in PDF points.
const A4_SHORT = 595.28;
const A4_LONG = 841.89;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("images").filter((f) => f instanceof File && f.size > 0);

    if (files.length === 0) {
      return badRequest("Please select at least one image to convert.");
    }

    const pdfDoc = await PDFDocument.create();
    pdfDoc.setProducer("PDF Hub");
    pdfDoc.setCreator("PDF Hub");

    let skipped = 0;

    for (const file of files) {
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const type = sniffImageType(buffer);
        if (!type) {
          skipped++;
          continue;
        }

        // pdf-lib can only embed JPEG/PNG directly; convert other formats
        // (WebP, GIF, TIFF) to PNG first.
        let embedded;
        if (type.mime === "image/jpeg") {
          embedded = await pdfDoc.embedJpg(buffer);
        } else if (type.mime === "image/png") {
          embedded = await pdfDoc.embedPng(buffer);
        } else {
          const pngBuffer = await sharp(buffer).png().toBuffer();
          embedded = await pdfDoc.embedPng(pngBuffer);
        }

        // Orient the page to match the image aspect ratio.
        const isLandscape = embedded.width > embedded.height;
        const pageWidth = isLandscape ? A4_LONG : A4_SHORT;
        const pageHeight = isLandscape ? A4_SHORT : A4_LONG;

        const page = pdfDoc.addPage([pageWidth, pageHeight]);
        const margin = 24;
        const scale = Math.min(
          (pageWidth - margin * 2) / embedded.width,
          (pageHeight - margin * 2) / embedded.height
        );
        const drawWidth = embedded.width * scale;
        const drawHeight = embedded.height * scale;

        page.drawImage(embedded, {
          x: (pageWidth - drawWidth) / 2,
          y: (pageHeight - drawHeight) / 2,
          width: drawWidth,
          height: drawHeight,
        });
      } catch (error) {
        console.error(`images-to-pdf: failed to embed ${file.name}:`, error.message);
        skipped++;
      }
    }

    const pageCount = pdfDoc.getPageCount();
    if (pageCount === 0) {
      return badRequest(
        "None of the selected files could be read as images. Supported formats: JPG, PNG, WebP, GIF and TIFF."
      );
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    const response = binaryResponse(pdfBytes, "application/pdf", downloadName(files[0], "-converted", "pdf"));
    if (skipped > 0) {
      response.headers.set("X-Skipped-Files", String(skipped));
    }
    return response;
  } catch (error) {
    console.error("images-to-pdf error:", error);
    return serverError();
  }
}
