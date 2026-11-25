import { PDFDocument } from "pdf-lib";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const newOrderStr = formData.get("newOrder");
    if (typeof newOrderStr !== "string" || !newOrderStr.trim()) {
      return badRequest("No page order provided. Reorder the pages and try again.");
    }

    const newOrder = newOrderStr
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((n) => Number.isInteger(n));

    if (newOrder.length === 0) {
      return badRequest("Invalid page order. Please use comma-separated page numbers (e.g. 3,1,2).");
    }

    let sourcePdf;
    try {
      sourcePdf = await PDFDocument.load(Buffer.from(await file.arrayBuffer()));
    } catch {
      return badRequest("This file could not be read as a PDF. It may be corrupted or password protected.");
    }
    const pageCount = sourcePdf.getPageCount();

    // The new order is a subset of the original pages: every listed page
    // must exist and appear at most once. Pages left out are deleted.
    const seen = new Set();
    for (const pageNumber of newOrder) {
      if (pageNumber < 1 || pageNumber > pageCount) {
        return badRequest(`Page ${pageNumber} does not exist in this ${pageCount}-page document.`);
      }
      if (seen.has(pageNumber)) {
        return badRequest(`Page ${pageNumber} appears more than once in the new order.`);
      }
      seen.add(pageNumber);
    }
    if (newOrder.length === 0) {
      return badRequest("At least one page must remain in the document.");
    }

    const newPdfDoc = await PDFDocument.create();
    const indices = newOrder.map((pageNumber) => pageNumber - 1);
    const copiedPages = await newPdfDoc.copyPages(sourcePdf, indices);
    copiedPages.forEach((page) => newPdfDoc.addPage(page));

    const pdfBytes = await newPdfDoc.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(file, "-organized", "pdf"));
  } catch (error) {
    console.error("organize-pdf error:", error);
    return serverError();
  }
}
