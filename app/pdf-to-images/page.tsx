import type { Metadata } from "next";
import { Image as ImageIcon } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import PdfToImagesTool from "./pdf-to-images-tool";

export const metadata: Metadata = {
  title: "PDF to Images",
  description:
    "Convert every PDF page into a JPG, PNG or WebP image at up to 300 DPI — delivered as a ZIP archive.",
};

export default function PdfToImagesPage() {
  return (
    <ToolShell
      toolHref="/pdf-to-images"
      icon={ImageIcon}
      title="PDF to Images"
      description="Convert every PDF page into a high-quality JPG, PNG or WebP image — delivered as one ZIP archive."
    >
      <PdfToImagesTool />
    </ToolShell>
  );
}
