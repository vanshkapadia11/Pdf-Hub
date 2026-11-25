import type { Metadata } from "next";
import { Stamp } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import AddPageNumbersTool from "./add-page-numbers-tool";

export const metadata: Metadata = {
  title: "Add Page Numbers to PDF",
  description:
    "Stamp page numbers onto a PDF — choose the position, starting page, starting number and format.",
};

export default function AddNumberToPagesPage() {
  return (
    <ToolShell
      toolHref="/add-number-to-pages"
      icon={Stamp}
      title="Add Page Numbers"
      description="Stamp page numbers onto a PDF with full control over position, start page, start number and format."
    >
      <AddPageNumbersTool />
    </ToolShell>
  );
}
