import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import * as XLSX from "xlsx";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";

export const runtime = "nodejs";

const MARGIN = 40;
const FONT_SIZE = 9;
const LINE_HEIGHT = 14;
const CELL_PADDING = 5;

/** pdf-lib standard fonts are WinAnsi-only; keep cell text encodable. */
function sanitizeCell(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/\r?\n/g, " ")
    .replace(/[\u0000-\u0008\u000B-\u001F]/g, " ")
    .replace(/[^\u0020-\u007E\u00A0-\u00FF]/g, "?")
    .trim();
}

/** Splits cell text into lines that fit the measured column width. */
function wrapCellText(text, font, fontSize, columnWidth) {
  if (!text) return [""];
  const maxWidth = columnWidth - CELL_PADDING * 2;
  const words = text.split(/\s+/);
  const lines = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  // Hard cap: a single cell never takes more than a third of a page.
  return lines.slice(0, 40);
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "excel", "Excel file");
    if (response) return response;

    const buffer = Buffer.from(await file.arrayBuffer());

    // Only trust actual Excel containers: xlsx is a ZIP ("PK"), xls is an
    // OLE compound file.
    const isXlsx = buffer[0] === 0x50 && buffer[1] === 0x4b;
    const isXls = buffer[0] === 0xd0 && buffer[1] === 0xcf && buffer[2] === 0x11 && buffer[3] === 0xe0;
    if (!isXlsx && !isXls) {
      return badRequest("This file is not an Excel workbook. Please upload a .xlsx or .xls file.");
    }

    let jsonData;
    try {
      const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
      const sheetName = workbook.SheetNames[0];
      jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, raw: false });
    } catch {
      return badRequest("This file could not be read as an Excel workbook. It may be corrupted.");
    }

    const rows = jsonData
      .map((row) => (Array.isArray(row) ? row.map(sanitizeCell) : [sanitizeCell(row)]))
      .filter((row) => row.some((cell) => cell !== ""));

    if (rows.length === 0) {
      return badRequest("The provided Excel file is empty or has no data.");
    }

    const columnCount = Math.max(...rows.map((row) => row.length));

    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Landscape suits wide tables.
    const isLandscape = columnCount >= 6;
    const pageWidth = isLandscape ? 841.89 : 595.28;
    const pageHeight = isLandscape ? 595.28 : 841.89;

    // Column widths from content, scaled to fit the printable area.
    const availableWidth = pageWidth - MARGIN * 2;
    const naturalWidths = Array.from({ length: columnCount }, (_, colIndex) => {
      let maxWidth = font.widthOfTextAtSize("Header", FONT_SIZE);
      for (const row of rows.slice(0, 200)) {
        const cell = row[colIndex] ?? "";
        const cellWidth = font.widthOfTextAtSize(cell, FONT_SIZE);
        if (cellWidth > maxWidth) maxWidth = cellWidth;
      }
      return Math.max(maxWidth + CELL_PADDING * 2, 45);
    });
    const naturalTotal = naturalWidths.reduce((sum, w) => sum + w, 0);
    const widthScale = Math.min(1, availableWidth / naturalTotal);
    const columnWidths = naturalWidths.map((w) => w * widthScale);

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let yPosition = pageHeight - MARGIN;
    const rowBackground = rgb(0.965, 0.97, 0.985);
    const headerBackground = rgb(0.88, 0.9, 0.96);
    const borderColor = rgb(0.82, 0.84, 0.88);

    const drawRow = (row, rowIndex) => {
      const cellLines = columnWidths.map((width, colIndex) =>
        wrapCellText(row[colIndex] ?? "", rowIndex === 0 ? boldFont : font, FONT_SIZE, width)
      );
      const rowLineCount = Math.max(1, ...cellLines.map((lines) => lines.length));
      const rowHeight = rowLineCount * LINE_HEIGHT + CELL_PADDING;

      if (yPosition - rowHeight < MARGIN) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        yPosition = pageHeight - MARGIN;
      }

      // Row background.
      page.drawRectangle({
        x: MARGIN,
        y: yPosition - rowHeight,
        width: availableWidth,
        height: rowHeight,
        color: rowIndex === 0 ? headerBackground : rowBackground,
      });

      // Cell borders + text.
      let x = MARGIN;
      cellLines.forEach((lines, colIndex) => {
        page.drawRectangle({
          x,
          y: yPosition - rowHeight,
          width: columnWidths[colIndex],
          height: rowHeight,
          borderColor,
          borderWidth: 0.5,
        });
        lines.forEach((text, lineIndex) => {
          page.drawText(text, {
            x: x + CELL_PADDING,
            y: yPosition - CELL_PADDING - (lineIndex + 1) * LINE_HEIGHT + 3,
            size: FONT_SIZE,
            font: rowIndex === 0 ? boldFont : font,
            color: rgb(0.1, 0.12, 0.18),
          });
        });
        x += columnWidths[colIndex];
      });

      yPosition -= rowHeight;
    };

    rows.forEach(drawRow);

    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    return binaryResponse(pdfBytes, "application/pdf", downloadName(file, "", "pdf"));
  } catch (error) {
    console.error("excel-to-pdf error:", error);
    return serverError();
  }
}
