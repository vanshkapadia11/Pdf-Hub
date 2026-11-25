import JSZip from "jszip";
import { validateUpload, binaryResponse, badRequest, serverError, getInt, clampQuality } from "@/lib/server/http";
import { renderPdfPages, PdfError } from "@/lib/server/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const format = String(formData.get("format") || "jpeg");
    if (!["jpeg", "png", "webp"].includes(format)) {
      return badRequest("Invalid image format. Supported formats: JPEG, PNG and WebP.");
    }
    const quality = clampQuality(getInt(formData, "quality", 90));
    const dpi = Math.min(300, Math.max(72, getInt(formData, "dpi", 150)));
    const scale = dpi / 72;

    const buffer = Buffer.from(await file.arrayBuffer());

    let rendered;
    try {
      rendered = await renderPdfPages(buffer, { scale, format, quality });
    } catch (error) {
      if (error instanceof PdfError) return badRequest(error.message);
      throw error;
    }

    if (rendered.pages.length === 0) {
      return badRequest("This PDF has no pages to convert.");
    }

    const zip = new JSZip();
    const ext = format === "jpeg" ? "jpg" : format;
    for (const page of rendered.pages) {
      zip.file(`page-${page.pageNumber}.${ext}`, page.buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

    const result = binaryResponse(zipBuffer, "application/zip", "pdf-pages.zip");
    result.headers.set("X-Page-Count", String(rendered.pages.length));
    return result;
  } catch (error) {
    console.error("pdf-to-images error:", error);
    return serverError();
  }
}
