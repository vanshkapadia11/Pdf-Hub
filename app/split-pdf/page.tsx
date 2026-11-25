import type { Metadata } from "next";
import { Scissors } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import SplitPdfTool from "./split-pdf-tool";

export const metadata: Metadata = {
  title: "Split PDF",
  description:
    "Split a PDF into separate documents by page ranges — each range becomes its own PDF, delivered as a ZIP.",
};

export default function SplitPdfPage() {
  return (
    <ToolShell
      toolHref="/split-pdf"
      icon={Scissors}
      title="Split PDF"
      description="Split a PDF into separate documents. Define page ranges like 1-3 or 4,7,9 — each range becomes its own PDF."
    >
      <SplitPdfTool />
    </ToolShell>
  );
}
