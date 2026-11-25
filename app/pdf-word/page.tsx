import type { Metadata } from "next";
import { FileType2 } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import PdfToWordTool from "./pdf-word-tool";

export const metadata: Metadata = {
  title: "PDF to Word",
  description:
    "Convert a text-based PDF into an editable Word (.docx) document — paragraphs and page breaks included.",
};

export default function PdfWordPage() {
  return (
    <ToolShell
      toolHref="/pdf-word"
      icon={FileType2}
      title="PDF to Word"
      description="Convert a text-based PDF into an editable Word (.docx) document, ready for Microsoft Word or Google Docs."
    >
      <PdfToWordTool />
    </ToolShell>
  );
}
