import type { Metadata } from "next";
import { Trash2 } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import RemovePagesTool from "./remove-pages-tool";

export const metadata: Metadata = {
  title: "Remove PDF Pages",
  description: "Delete unwanted pages from a PDF. Enter the pages to remove and download the cleaned document.",
};

export default function RemovePdfPagesPage() {
  return (
    <ToolShell
      toolHref="/remove-pdf-pages"
      icon={Trash2}
      title="Remove PDF Pages"
      description="Delete unwanted pages from a PDF. Everything else stays exactly as it was."
    >
      <RemovePagesTool />
    </ToolShell>
  );
}
