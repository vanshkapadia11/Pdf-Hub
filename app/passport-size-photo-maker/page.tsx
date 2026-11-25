import type { Metadata } from "next";
import { IdCard } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import PassportPhotoTool from "./passport-photo-tool";

export const metadata: Metadata = {
  title: "Passport Photo Maker",
  description:
    "Create printable passport photo sheets — 35×45mm, 2×2 inch and custom sizes, tiled with cut guides at 300 DPI.",
};

export default function PassportSizePhotoMakerPage() {
  return (
    <ToolShell
      toolHref="/passport-size-photo-maker"
      icon={IdCard}
      title="Passport Photo Maker"
      description="Turn one photo into a printable sheet of passport photos — standard sizes, tiled automatically with cut guides."
    >
      <PassportPhotoTool />
    </ToolShell>
  );
}
