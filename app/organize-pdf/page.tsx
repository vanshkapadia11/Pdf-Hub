import type { Metadata } from "next";
import { Shuffle } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import OrganizePdfTool from "./organize-pdf-tool";

export const metadata: Metadata = {
  title: "Organize PDF",
  description:
    "Reorder and delete PDF pages with a visual page grid. Drag thumbnails into any order and download the reorganized document.",
};

export default function OrganizePdfPage() {
  return (
    <ToolShell
      toolHref="/organize-pdf"
      icon={Shuffle}
      title="Organize PDF"
      description="Reorder pages with drag and drop and delete the ones you don't need — with a live preview of every page."
    >
      <OrganizePdfTool />
    </ToolShell>
  );
}
