import type { Metadata } from "next";
import { Type } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import EditPdfTool from "./edit-pdf-tool";

export const metadata: Metadata = {
  title: "Edit PDF — Add Text",
  description:
    "Add text to any page of a PDF: choose the page, position, size and color. Everything happens in your browser.",
};

export default function EditPdfPage() {
  return (
    <ToolShell
      toolHref="/edit-pdf"
      icon={Type}
      title="Edit PDF"
      description="Add text to any page of a PDF — position, size and color are all yours to choose. Runs 100% in your browser."
    >
      <EditPdfTool />
    </ToolShell>
  );
}
