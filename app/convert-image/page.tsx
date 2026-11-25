import type { Metadata } from "next";
import { ArrowLeftRight } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import ConvertImageTool from "./convert-image-tool";

export const metadata: Metadata = {
  title: "Convert Image Format",
  description:
    "Convert images between JPG, PNG and WebP instantly — with transparent areas preserved or flattened to white.",
};

export default function ConvertImagePage() {
  return (
    <ToolShell
      toolHref="/convert-image"
      icon={ArrowLeftRight}
      title="Convert Image"
      description="Switch between JPG, PNG and WebP. Transparent backgrounds become white when converting to JPG."
    >
      <ConvertImageTool />
    </ToolShell>
  );
}
