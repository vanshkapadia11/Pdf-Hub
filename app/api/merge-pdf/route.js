import { PDFDocument } from "pdf-lib";
import { binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("pdfs").filter((f) => f instanceof File && f.size > 0);

    if (files.length < 2) {
      return badRequest("Please select at least 2 PDF files to merge.");
    }

    const merged = await PDFDocument.create();
    merged.setProducer("PDF Hub");
    merged.setCreator("PDF Hub");

    for (const file of files) {
      try {
        const bytes = Buffer.from(await file.arrayBuffer());
        const source = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(source, source.getPageIndices());
        pages.forEach((page) => merged.addPage(page));
      } catch (error) {
        const encrypted = error?.message?.toLowerCase().includes("encrypt");
        return badRequest(
          encrypted
            ? `"${file.name}" is password protected. Please remove the password first.`
            : `"${file.name}" could not be read as a PDF.`
        );
      }
    }

    const pdfBytes = await merged.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(files[0], "-merged", "pdf"));
  } catch (error) {
    console.error("merge-pdf error:", error);
    return serverError();
  }
}
