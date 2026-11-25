import { PDFDocument } from "pdf-lib";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";
import { parsePageSelection } from "@/lib/server/page-selection";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const pagesToRemoveStr = formData.get("pagesToRemove");
    if (typeof pagesToRemoveStr !== "string" || !pagesToRemoveStr.trim()) {
      return badRequest("Please specify which pages to remove (e.g. 2 or 1-3,5).");
    }

    let pagesToRemove;
    try {
      pagesToRemove = parsePageSelection(pagesToRemoveStr);
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

    if (pagesToRemove.size >= pageCount) {
      return badRequest("You cannot remove every page — at least one page must remain.");
    }

    const kept = [];
    for (let i = 0; i < pageCount; i++) {
      if (!pagesToRemove.has(i + 1)) kept.push(i);
    }

    const newPdfDoc = await PDFDocument.create();
    const copiedPages = await newPdfDoc.copyPages(sourcePdf, kept);
    copiedPages.forEach((page) => newPdfDoc.addPage(page));

    const pdfBytes = await newPdfDoc.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(file, "-pages-removed", "pdf"));
  } catch (error) {
    console.error("remove-pdf-pages error:", error);
    return serverError();
  }
}
