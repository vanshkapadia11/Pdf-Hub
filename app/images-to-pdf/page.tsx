import type { Metadata } from "next";
import { Images } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import ImagesToPdfTool from "./images-to-pdf-tool";

export const metadata: Metadata = {
  title: "Images to PDF",
  description:
    "Combine JPG, PNG, WebP, GIF and TIFF images into a single PDF — one page per image, in your chosen order.",
};

export default function ImagesToPdfPage() {
  return (
    <ToolShell
      toolHref="/images-to-pdf"
      icon={Images}
      title="Images to PDF"
      description="Combine JPG, PNG, WebP, GIF and TIFF images into a single PDF. Drag to set the page order."
    >
      <ImagesToPdfTool />
    </ToolShell>
  );
}
