import type { Metadata } from "next";
import { Combine } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import MergePdfTool from "./merge-pdf-tool";

export const metadata: Metadata = {
  title: "Merge PDF",
  description:
    "Combine multiple PDF files into a single document. Drag to arrange the order before merging — free and instant.",
};

export default function MergePdfPage() {
  return (
    <ToolShell
      toolHref="/merge-pdf"
      icon={Combine}
      title="Merge PDF"
      description="Combine multiple PDF files into one document. Drag the rows to arrange the merge order."
    >
      <MergePdfTool />
    </ToolShell>
  );
}
