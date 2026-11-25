import type { Metadata } from "next";
import { SlidersHorizontal } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import AddFiltersTool from "./add-filters-tool";

export const metadata: Metadata = {
  title: "Image Filters",
  description:
    "Adjust image brightness, contrast and saturation with a live preview — free and instant, no upload of settings needed.",
};

export default function AddFiltersPage() {
  return (
    <ToolShell
      toolHref="/add-filters"
      icon={SlidersHorizontal}
      title="Image Filters"
      description="Adjust brightness, contrast and saturation with a live preview that shows exactly what you'll download."
    >
      <AddFiltersTool />
    </ToolShell>
  );
}
