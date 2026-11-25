import type { Metadata } from "next";
import { MoveVertical } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import ResizeImageTool from "./resize-image-tool";

export const metadata: Metadata = {
  title: "Resize Image",
  description:
    "Resize images by exact pixels or percentage, with aspect-ratio lock and format choice — free and instant.",
};

export default function ResizeImagePage() {
  return (
    <ToolShell
      toolHref="/resize-image"
      icon={MoveVertical}
      title="Resize Image"
      description="Resize by exact pixels or percentage. The aspect ratio can stay locked or be stretched to fit."
    >
      <ResizeImageTool />
    </ToolShell>
  );
}
