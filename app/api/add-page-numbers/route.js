import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError, getInt } from "@/lib/server/http";

export const runtime = "nodejs";

const POSITIONS = [
  "bottom-center",
  "bottom-left",
  "bottom-right",
  "top-center",
  "top-left",
  "top-right",
];

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const position = String(formData.get("position") || "bottom-center");
    if (!POSITIONS.includes(position)) {
      return badRequest("Invalid page number position.");
    }

    const startPage = getInt(formData, "startPage", 1);
    const startNumber = getInt(formData, "startNumber", 1);
    if (startPage < 1) return badRequest("Start page must be 1 or greater.");
    if (startNumber < 1) return badRequest("Start number must be 1 or greater.");

    const pageFormat = String(formData.get("pageFormat") || "plain");
    const fontColor = String(formData.get("fontColor") || "black");

    let pdfDoc;
    try {
      pdfDoc = await PDFDocument.load(Buffer.from(await file.arrayBuffer()));
    } catch {
      return badRequest("This file could not be read as a PDF. It may be corrupted or password protected.");
    }

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    if (startPage > totalPages) {
      return badRequest(`This document only has ${totalPages} page${totalPages === 1 ? "" : "s"}, so numbering cannot start at page ${startPage}.`);
    }

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const textColor = fontColor === "white" ? rgb(1, 1, 1) : rgb(0.15, 0.15, 0.15);
    const fontSize = 11;
    const margin = 28;

    for (let i = 0; i < totalPages; i++) {
      const pageNumber = i + 1;
      if (pageNumber < startPage) continue;

      const effectiveNumber = startNumber + (pageNumber - startPage);
      const lastNumber = startNumber + (totalPages - startPage);
      const text =
        pageFormat === "page_of_total" ? `${effectiveNumber} of ${lastNumber}` : `${effectiveNumber}`;

      const page = pages[i];
      const { width, height } = page.getSize();
      const textWidth = helvetica.widthOfTextAtSize(text, fontSize);

      let x;
      if (position.endsWith("left")) x = margin;
      else if (position.endsWith("right")) x = width - textWidth - margin;
      else x = width / 2 - textWidth / 2;

      const y = position.startsWith("top") ? height - margin - fontSize : margin;

      page.drawText(text, { x, y, size: fontSize, font: helvetica, color: textColor });
    }

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(file, "-numbered", "pdf"));
  } catch (error) {
    console.error("add-page-numbers error:", error);
    return serverError();
  }
}
