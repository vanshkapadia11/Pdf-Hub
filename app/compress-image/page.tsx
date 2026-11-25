import type { Metadata } from "next";
import { Scaling } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import CompressImageTool from "./compress-image-tool";

export const metadata: Metadata = {
  title: "Compress Image",
  description:
    "Reduce image file size by quality percentage or an exact target size in KB — free, instant, no quality surprises.",
};

export default function CompressImagePage() {
  return (
    <ToolShell
      toolHref="/compress-image"
      icon={Scaling}
      title="Compress Image"
      description="Shrink image files with a quality slider or an exact target size in KB. The format stays the same."
    >
      <CompressImageTool />
    </ToolShell>
  );
}
