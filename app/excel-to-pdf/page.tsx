import type { Metadata } from "next";
import { FileSpreadsheet } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import ExcelToPdfTool from "./excel-to-pdf-tool";

export const metadata: Metadata = {
  title: "Excel to PDF",
  description:
    "Convert Excel (.xlsx/.xls) spreadsheets into clean, printable PDF tables with headers and gridlines.",
};

export default function ExcelToPdfPage() {
  return (
    <ToolShell
      toolHref="/excel-to-pdf"
      icon={FileSpreadsheet}
      title="Excel to PDF"
      description="Turn Excel spreadsheets into clean, printable PDF tables — with bold headers, gridlines and automatic pagination."
    >
      <ExcelToPdfTool />
    </ToolShell>
  );
}
