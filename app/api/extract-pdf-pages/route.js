import { PDFDocument } from "pdf-lib";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";
import { parsePageSelection } from "@/lib/server/page-selection";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const pagesToKeepStr = formData.get("pagesToKeep");
    if (typeof pagesToKeepStr !== "string" || !pagesToKeepStr.trim()) {
      return badRequest("Please specify which pages to extract (e.g. 2 or 1-3,5).");
    }

    let pagesToKeep;
    try {
      pagesToKeep = parsePageSelection(pagesToKeepStr);
    } catch (error) {
      return badRequest(error.message);
    }

    let sourcePdf;
    try {
      sourcePdf = await PDFDocument.load(Buffer.from(await file.arrayBuffer()));
    } catch {
      return badRequest("This file could not be read as a PDF. It may be corrupted or password protected.");
    }
    const pageCount = sourcePdf.getPageCount();

    const indicesToKeep = [];
    for (let i = 0; i < pageCount; i++) {
      if (pagesToKeep.has(i + 1)) indicesToKeep.push(i);
    }

    if (indicesToKeep.length === 0) {
      return badRequest(`None of the selected pages exist in this ${pageCount}-page document.`);
    }

    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(sourcePdf, indicesToKeep);
    copiedPages.forEach((page) => newPdfDoc.addPage(page));

    const pdfBytes = await newPdfDoc.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(file, "-extracted", "pdf"));
  } catch (error) {
    console.error("extract-pdf-pages error:", error);
    return serverError();
  }
}
