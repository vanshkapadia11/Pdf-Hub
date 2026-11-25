import type { Metadata } from "next";
import { Shuffle } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import RotateImageTool from "./rotate-image-tool";

export const metadata: Metadata = {
  title: "Rotate & Flip Image",
  description:
    "Rotate images by 90° steps and flip them horizontally or vertically, with a live preview — free and instant.",
};

export default function RotateImagePage() {
  return (
    <ToolShell
      toolHref="/rotate-image"
      icon={Shuffle}
      title="Rotate & Flip Image"
      description="Rotate by 90° steps or mirror the image. The preview shows exactly what you'll download."
    >
      <RotateImageTool />
    </ToolShell>
  );
}
