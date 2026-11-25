import type { Metadata } from "next";
import { Sparkles } from "lucide-react";
import ToolShell from "@/components/site/ToolShell";
import KycCompressorTool from "./kyc-compressor-tool";

export const metadata: Metadata = {
  title: "KYC Image Compressor",
  description:
    "Compress documents and photos to exact KB limits (50/100/200 KB or custom) for KYC, bank and government form uploads.",
};

export default function KycImageCompressorPage() {
  return (
    <ToolShell
      toolHref="/kyc-image-compressor"
      icon={Sparkles}
      title="KYC Image Compressor"
      description="Hit exact KB limits for KYC, bank and government uploads — 50, 100, 200 KB or any custom size."
    >
      <KycCompressorTool />
    </ToolShell>
  );
}
