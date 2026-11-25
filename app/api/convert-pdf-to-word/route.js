import { Document, Packer, Paragraph, TextRun, HeadingLevel, PageBreak, AlignmentType } from "docx";
import { validateUpload, binaryResponse, downloadName, badRequest, serverError } from "@/lib/server/http";
import { extractTextItems, itemsToLines, linesToParagraphs, PdfError } from "@/lib/server/pdf";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request) {
  try {
    const formData = await request.formData();
    const { file, response } = validateUpload(formData, "pdf", "PDF file");
    if (response) return response;

    const buffer = Buffer.from(await file.arrayBuffer());

    let pages;
    try {
      pages = linesToParagraphs(itemsToLines(await extractTextItems(buffer)));
    } catch (error) {
      if (error instanceof PdfError) return badRequest(error.message);
      throw error;
    }

    const totalCharacters = pages.reduce(
      (sum, page) => sum + page.paragraphs.join("").length,
      0
    );
    if (totalCharacters === 0) {
      return badRequest(
        "This PDF does not contain selectable text (it looks like a scanned document), so it cannot be converted to Word."
      );
    }

    const children = [
      new Paragraph({
        text: file.name.replace(/\.[^.]+$/, "") || "Converted Document",
        heading: HeadingLevel.HEADING_1,
      }),
    ];

    pages.forEach((page, pageIndex) => {
      if (pageIndex > 0) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      page.paragraphs.forEach((text) => {
        children.push(
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [new TextRun({ text, size: 24, font: "Arial" })],
          })
        );
      });
    });

    const doc = new Document({
      creator: "PDF Hub",
      title: file.name.replace(/\.[^.]+$/, ""),
      sections: [{ properties: {}, children }],
    });

    const docxBuffer = await Packer.toBuffer(doc);
    return binaryResponse(
      docxBuffer,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      downloadName(file, "", "docx")
    );
  } catch (error) {
    console.error("convert-pdf-to-word error:", error);
    return serverError();
  }
}
