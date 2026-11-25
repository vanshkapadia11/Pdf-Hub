import type { Metadata } from "next";
import { Crop } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import CropImageTool from "./crop-image-tool";

export const metadata: Metadata = {
  title: "Crop Image",
  description: "Crop images to exact pixel coordinates and dimensions, with a live preview of the crop area.",
};

export default function CropImagePage() {
  return (
    <ToolShell
      toolHref="/crop-image"
      icon={Crop}
      title="Crop Image"
      description="Cut out an exact rectangle from an image. Set the position and size in pixels, with a live preview."
    >
      <CropImageTool />
    </ToolShell>
  );
}
