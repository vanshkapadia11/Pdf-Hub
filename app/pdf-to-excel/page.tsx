import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import PdfToExcelTool from "./pdf-to-excel-tool";

export const metadata: Metadata = {
  title: "PDF to Excel",
  description:
    "Extract tables and text from a PDF into an Excel (.xlsx) spreadsheet, with columns detected automatically.",
};

export default function PdfToExcelPage() {
  return (
    <ToolShell
      toolHref="/pdf-to-excel"
      icon={FileSpreadsheet}
      title="PDF to Excel"
      description="Extract tables and text from a PDF into an Excel (.xlsx) sheet. Columns are detected from the layout automatically."
    >
      <PdfToExcelTool />
    </ToolShell>
  );
}
