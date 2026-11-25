/**
 * Server-side PDF utilities built on pdfjs-dist (legacy Node build) and
 * @napi-rs/canvas. Provides rasterization, rebuild and positioned text
 * extraction for the API routes.
 *
 * Note: pdfjs-dist and @napi-rs/canvas are listed in
 * `serverExternalPackages`, so these imports are resolved by Node at
 * runtime instead of being bundled.
 */
import path from "node:path";
import { createCanvas } from "@napi-rs/canvas";

let pdfjsPromise = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/legacy/build/pdf.mjs");
  }
  return pdfjsPromise;
}

/**
 * Absolute URLs for the pdfjs asset folders (standard fonts + CJK cmaps).
 * pdf.js validates these with a trailing-forward-slash check ("endsWith('/')"),
 * so normalize to POSIX separators on every OS: on Windows path.join +
 * path.sep yield a trailing "\", which pdf.js rejects with
 * "Invalid factory url ... must include trailing slash".
 */
function pdfjsAssetPath(folder) {
  const dir = path.join(process.cwd(), "node_modules", "pdfjs-dist", folder);
  return `${dir.split(path.sep).join("/")}/`;
}

class NapiCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

/** Normalizes pdfjs errors into friendly messages re-thrown as PdfError. */
export class PdfError extends Error {}

async function openPdf(data) {
  const pdfjs = await loadPdfjs();
  try {
    const task = pdfjs.getDocument({
      data: new Uint8Array(data),
      canvasFactory: new NapiCanvasFactory(),
      isEvalSupported: false,
      useSystemFonts: true,
      standardFontDataUrl: pdfjsAssetPath("standard_fonts"),
      cMapUrl: pdfjsAssetPath("cmaps"),
      cMapPacked: true,
    });
    return await task.promise;
  } catch (error) {
    const name = error && error.name;
    if (name === "PasswordException") {
      throw new PdfError(
        "This PDF is password protected. Please remove the password first and try again.",
      );
    }
    if (name === "InvalidPDFException") {
      throw new PdfError("This file is not a valid PDF or is corrupted.");
    }
    throw error;
  }
}

function encodeCanvas(canvas, format, quality) {
  if (format === "png") return canvas.toBuffer("image/png");
  if (format === "webp") return canvas.toBuffer("image/webp", quality);
  return canvas.toBuffer("image/jpeg", quality);
}

/**
 * Renders PDF pages to image buffers.
 * Returns { numPages, pages: [{ pageNumber, buffer, width, height, baseWidth, baseHeight }] }
 * where base* are the page dimensions in PDF points (scale 1).
 */
export async function renderPdfPages(data, options = {}) {
  const { scale = 2, format = "jpeg", quality = 90, pages = null } = options;
  const doc = await openPdf(data);
  try {
    const wanted =
      Array.isArray(pages) && pages.length > 0
        ? pages.filter(
            (p) => Number.isInteger(p) && p >= 1 && p <= doc.numPages,
          )
        : Array.from({ length: doc.numPages }, (_, i) => i + 1);

    const results = [];
    for (const pageNumber of wanted) {
      const page = await doc.getPage(pageNumber);
      const base = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(
        Math.max(1, Math.ceil(viewport.width)),
        Math.max(1, Math.ceil(viewport.height)),
      );
      const context = canvas.getContext("2d");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvasContext: context, viewport, canvas }).promise;
      page.cleanup();
      results.push({
        pageNumber,
        buffer: encodeCanvas(canvas, format, quality),
        width: canvas.width,
        height: canvas.height,
        baseWidth: base.width,
        baseHeight: base.height,
      });
    }
    return { numPages: doc.numPages, pages: results };
  } finally {
    await doc.destroy();
  }
}

/**
 * Rasterizes every page and rebuilds a PDF from the encoded images.
 * This is the actual compression step for image-heavy documents.
 * Returns the saved PDF bytes.
 */
export async function rasterizeToPdf(data, { scale = 1.5, quality = 70 } = {}) {
  const { PDFDocument } = await import("pdf-lib");
  const { pages } = await renderPdfPages(data, {
    scale,
    format: "jpeg",
    quality,
  });
  if (pages.length === 0) {
    throw new PdfError("This PDF has no pages to process.");
  }
  const out = await PDFDocument.create();
  for (const rendered of pages) {
    const image = await out.embedJpg(rendered.buffer);
    const page = out.addPage([rendered.baseWidth, rendered.baseHeight]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: rendered.baseWidth,
      height: rendered.baseHeight,
    });
  }
  return out.save({ useObjectStreams: true });
}

/**
 * Extracts positioned text items per page.
 * Returns [{ pageNumber, height, items: [{ str, x, y, width, height }] }]
 * with y measured from the TOP of the page (screen coordinates).
 */
export async function extractTextItems(data) {
  const doc = await openPdf(data);
  try {
    const result = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
      const page = await doc.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1 });
      const content = await page.getTextContent();
      const items = content.items
        .filter(
          (item) => typeof item.str === "string" && item.str.trim().length > 0,
        )
        .map((item) => ({
          str: item.str,
          x: item.transform[4],
          y: viewport.height - item.transform[5],
          width: item.width || item.str.length * 5,
          height: Math.abs(item.transform[3]) || 10,
        }));
      result.push({
        pageNumber,
        height: viewport.height,
        width: viewport.width,
        items,
      });
      page.cleanup();
    }
    return result;
  } finally {
    await doc.destroy();
  }
}

/**
 * Groups text items into visual lines (rows) per page.
 * Returns [{ pageNumber, lines: [{ y, items: [{ str, x, width }] }] }]
 */
export function itemsToLines(pages) {
  const TOLERANCE = 4; // pts — items within this vertical distance share a line
  return pages.map((page) => {
    const lines = [];
    for (const item of page.items) {
      const line = lines.find((l) => Math.abs(l.y - item.y) <= TOLERANCE);
      if (line) {
        line.items.push(item);
      } else {
        lines.push({ y: item.y, items: [item] });
      }
    }
    for (const line of lines) {
      line.items.sort((a, b) => a.x - b.x);
    }
    lines.sort((a, b) => a.y - b.y);
    return { pageNumber: page.pageNumber, lines };
  });
}

/**
 * Merges lines into plain text paragraphs (for PDF -> Word).
 * Lines separated by roughly one line-height stay in the same paragraph.
 */
export function linesToParagraphs(linePages) {
  const output = [];
  for (const page of linePages) {
    const paragraphs = [];
    let current = null;
    let lastBottom = null;
    for (const line of page.lines) {
      const text = line.items
        .map((item) => item.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      if (!text) continue;
      const lineHeight = Math.max(8, ...line.items.map((item) => item.height));
      const newParagraph =
        current === null ||
        lastBottom === null ||
        Math.abs(line.y - lastBottom) > lineHeight * 1.8;
      if (newParagraph) {
        current = text;
        paragraphs.push(current);
      } else {
        current = `${current} ${text}`;
      }
      lastBottom = line.y;
    }
    output.push({ pageNumber: page.pageNumber, paragraphs });
  }
  return output;
}
