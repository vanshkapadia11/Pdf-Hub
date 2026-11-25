import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import {
  validateUpload,
  binaryResponse,
  badRequest,
  serverError,
} from "@/lib/server/http";

export const runtime = "nodejs";

/** Parses a range expression into zero-based page indices. */
function parseRange(range, pageCount) {
  const indices = [];
  const addIndex = (num) => {
    const index = Number.parseInt(num, 10) - 1;
    if (Number.isNaN(index) || index < 0 || index >= pageCount) {
      throw new Error(`"${range}" refers to a page outside the document (1-${pageCount}).`);
    }
    indices.push(index);
  };

  if (range.includes("-")) {
    const [rawStart, rawEnd] = range.split("-").map((part) => part.trim());
    const start = Number.parseInt(rawStart, 10);
    const end = Number.parseInt(rawEnd, 10);
    if (Number.isNaN(start) || Number.isNaN(end) || start < 1 || end > pageCount || start > end) {
      throw new Error(`"${range}" is not a valid range for a ${pageCount}-page document.`);
    }
    for (let i = start - 1; i <= end - 1; i++) indices.push(i);
  } else if (range.includes(",")) {
    range.split(",").map((part) => part.trim()).forEach(addIndex);
  } else {
    addIndex(range.trim());
  }
  return indices;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const rangesString = formData.get("ranges");
    if (!rangesString) {
      return badRequest("No page ranges specified.");
    }

    let ranges;
    try {
      ranges = JSON.parse(rangesString);
    } catch {
      return badRequest("Invalid range data received. Please refresh the page and try again.");
    }
    if (!Array.isArray(ranges)) {
      return badRequest("Invalid range data received. Please refresh the page and try again.");
    }
    const validRanges = ranges.map((r) => String(r).trim()).filter((r) => r.length > 0);
    if (validRanges.length === 0) {
      return badRequest("Please specify at least one valid page range.");
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    let sourcePdf;
    try {
      sourcePdf = await PDFDocument.load(bytes);
    } catch {
      return badRequest("This file could not be read as a PDF. It may be corrupted or password protected.");
    }
    const pageCount = sourcePdf.getPageCount();

    const zip = new JSZip();
    try {
      for (let i = 0; i < validRanges.length; i++) {
        const pageIndices = parseRange(validRanges[i], pageCount);
        const pdfDoc = await PDFDocument.create();
        const pages = await pdfDoc.copyPages(sourcePdf, pageIndices);
        pages.forEach((page) => pdfDoc.addPage(page));
        const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
        zip.file(`part-${i + 1}-pages-${validRanges[i].replace(/[^\d,\-]/g, "x")}.pdf`, pdfBytes);
      }
    } catch (error) {
      return badRequest(error.message || "Invalid page range format.");
    }

    const zipContent = await zip.generateAsync({ type: "nodebuffer" });
    return binaryResponse(zipContent, "application/zip", "split-documents.zip");
  } catch (error) {
    console.error("split-pdf error:", error);
    return serverError();
  }
}
