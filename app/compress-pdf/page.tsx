import type { Metadata } from "next";
import { Scaling } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import CompressPdfTool from "./compress-pdf-tool";

export const metadata: Metadata = {
  title: "Compress PDF",
  description:
    "Shrink PDF file size with preset levels, custom quality or an exact target size — free and instant.",
};

export default function CompressPdfPage() {
  return (
    <ToolShell
      toolHref="/compress-pdf"
      icon={Scaling}
      title="Compress PDF"
      description="Shrink PDF file size with a preset, custom quality, or an exact target size in MB."
    >
      <CompressPdfTool />
    </ToolShell>
  );
}
