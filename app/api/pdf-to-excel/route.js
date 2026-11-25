import ExcelJS from "exceljs";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";
import { extractTextItems, itemsToLines, PdfError } from "@/lib/server/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

const CELL_MERGE_GAP = 14; // pts — items closer than this belong to the same cell
const COLUMN_TOLERANCE = 18; // pts — cell starts within this distance share a column

/**
 * Turns one page of visual lines into a 2D row/column matrix.
 * Cells are merged from adjacent text items; columns are discovered by
 * clustering the horizontal start position of every cell on the page.
 */
function pageToRows(page) {
  const rows = page.lines
    .map((line) => {
      const cells = [];
      let current = null;
      for (const item of line.items) {
        if (current && item.x - (current.x + current.width) < CELL_MERGE_GAP) {
          const joiner = item.x - (current.x + current.width) > 1.5 ? " " : "";
          current.str = `${current.str}${joiner}${item.str}`;
          current.width = item.x + item.width - current.x;
        } else {
          current = { x: item.x, width: item.width, str: item.str.trim() };
          if (current.str) cells.push(current);
        }
      }
      return { y: line.y, cells };
    })
    .filter((row) => row.cells.length > 0);

  if (rows.length === 0) return [];

  // Discover column anchors from the start position of every cell.
  const anchors = [];
  for (const row of rows) {
    for (const cell of row.cells) {
      const anchor = anchors.find((a) => Math.abs(a.x - cell.x) <= COLUMN_TOLERANCE);
      if (anchor) {
        anchor.x = (anchor.x * anchor.count + cell.x) / (anchor.count + 1);
        anchor.count += 1;
      } else {
        anchors.push({ x: cell.x, count: 1 });
      }
    }
  }
  anchors.sort((a, b) => a.x - b.x);

  return rows.map((row) => {
    const values = new Array(anchors.length).fill(undefined);
    for (const cell of row.cells) {
      let best = 0;
      let bestDistance = Infinity;
      anchors.forEach((anchor, i) => {
        const distance = Math.abs(anchor.x - cell.x);
        if (distance < bestDistance) {
          bestDistance = distance;
          best = i;
        }
      });
      values[best] = cell.str;
    }
    // Right-trim trailing empty cells.
    while (values.length > 0 && values[values.length - 1] === undefined) values.pop();
    return values;
  });
}

/** Converts text to a number when it unambiguously is one (Excel-friendly). */
function tryParseCell(value) {
  if (typeof value !== "string") return value;
  const trimmed = value.trim();
  if (!/^-?\d{1,12}(\.\d+)?$/.test(trimmed)) return value;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : value;
}

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const buffer = Buffer.from(await file.arrayBuffer());

    let pages;
    try {
      pages = itemsToLines(await extractTextItems(buffer));
    } catch (error) {
      if (error instanceof PdfError) return badRequest(error.message);
      throw error;
    }

    const rowsByPage = pages.map(pageToRows);
    const totalRows = rowsByPage.reduce((sum, rows) => sum + rows.length, 0);
    if (totalRows === 0) {
      return badRequest(
        "This PDF does not contain selectable text (it looks like a scanned document), so it cannot be converted to Excel."
      );
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "PDF Hub";
    const worksheet = workbook.addWorksheet("Extracted Data");

    const columnCount = Math.max(...rowsByPage.map((rows) => Math.max(0, ...rows.map((r) => r.length))));
    for (let i = 1; i <= columnCount; i++) {
      worksheet.getColumn(i).width = 24;
    }

    for (const rows of rowsByPage) {
      for (const row of rows) {
        worksheet.addRow(row.map((cell) => (cell === undefined ? null : tryParseCell(cell))));
      }
    }
    worksheet.views = [{ state: "frozen", ySplit: 1 }];

    const excelBuffer = await workbook.xlsx.writeBuffer();
    return binaryResponse(
      excelBuffer,
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      downloadName(file, "", "xlsx")
    );
  } catch (error) {
    console.error("pdf-to-excel error:", error);
    return serverError();
  }
}
