import type { Metadata } from "next";
import { Layers } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import ExtractPagesTool from "./extract-pages-tool";

export const metadata: Metadata = {
  title: "Extract PDF Pages",
  description:
    "Extract selected pages from a PDF into a brand-new document — great for pulling out a single chapter or form.",
};

export default function ExtractPdfPagesPage() {
  return (
    <ToolShell
      toolHref="/extract-pdf-pages"
      icon={Layers}
      title="Extract PDF Pages"
      description="Pull selected pages out of a PDF into a new document. The original file stays untouched."
    >
      <ExtractPagesTool />
    </ToolShell>
  );
}
