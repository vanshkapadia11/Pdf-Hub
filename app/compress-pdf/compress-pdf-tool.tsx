"use client";

import { useState } from "react";
import { Gauge, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob, infoHeader } from "@/hooks/use-tool-job";
import { formatFileSize, sizeReduction } from "@/lib/client/api";

type CompressionMode = "preset" | "custom" | "target";

const PRESETS = [
  { value: "low", label: "Low compression", description: "Best quality, smallest reduction", quality: 90 },
  { value: "medium", label: "Medium compression", description: "Balanced — recommended", quality: 75 },
  { value: "high", label: "High compression", description: "Noticeably smaller, good quality", quality: 60 },
  { value: "maximum", label: "Maximum compression", description: "Smallest file, visible quality loss", quality: 45 },
];

export default function CompressPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<CompressionMode>("preset");
  const [level, setLevel] = useState("medium");
  const [customQuality, setCustomQuality] = useState(75);
  const [removeMetadata, setRemoveMetadata] = useState(true);
  const [downsampleImages, setDownsampleImages] = useState(true);
  const [targetSize, setTargetSize] = useState("1");
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const handleFile = (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setFile(picked);
  };

  const handleCompress = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("compressionType", mode);

    if (mode === "preset") {
      formData.append("compressionLevel", level);
    } else if (mode === "custom") {
      formData.append("customQuality", String(customQuality));
      formData.append("removeMetadata", String(removeMetadata));
      formData.append("downsampleImages", String(downsampleImages));
    } else {
      const target = Number(targetSize);
      if (!Number.isFinite(target) || target < 0.05 || target > 50) {
        setError("Target size must be between 0.05 MB and 50 MB.");
        return;
      }
      formData.append("targetSize", String(target));
    }

    await run("/api/compress-pdf", formData);
  };

  const originalSize = file?.size ?? 0;
  const compressedSize = result
    ? Number(result.headers.get("X-Compressed-Size")) || result.size
    : 0;
  const reduction = result && originalSize > 0 ? sizeReduction(originalSize, compressedSize) : 0;
  const note = result ? infoHeader(result.headers, "X-Compression-Note") : undefined;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download compressed PDF"
        stats={[
          { label: "Original size", value: formatFileSize(originalSize) },
          {
            label: "Compressed size",
            value: `${formatFileSize(compressedSize)} (${reduction > 0 ? `${reduction}% smaller` : "no change"})`,
          },
        ]}
        note={note}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Compressing your PDF…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Max 50 MB. Presets, custom quality or an exact target size."
          accept="application/pdf,.pdf"
          onFiles={handleFile}
        />
      ) : (
        <FileChip
          name={file.name}
          size={file.size}
          onRemove={() => {
            setFile(null);
            setError(null);
          }}
        />
      )}

      {error && <ErrorBox message={error} />}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Compression settings</CardTitle>
            <CardDescription>Choose how aggressively the PDF should be shrunk.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => setMode(value as CompressionMode)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="preset" className="gap-1.5">
                  <Gauge size={14} />
                  Preset
                </TabsTrigger>
                <TabsTrigger value="custom">Custom</TabsTrigger>
                <TabsTrigger value="target">Target size</TabsTrigger>
              </TabsList>

              <TabsContent value="preset" className="mt-4">
                <RadioGroup value={level} onValueChange={setLevel} className="space-y-2.5">
                  {PRESETS.map((preset) => (
                    <Label
                      key={preset.value}
                      className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/70 p-3.5 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50"
                    >
                      <RadioGroupItem value={preset.value} className="mt-0.5" />
                      <span className="grid gap-0.5">
                        <span className="text-sm font-semibold text-slate-700">{preset.label}</span>
                        <span className="text-xs text-slate-400">{preset.description}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </TabsContent>

              <TabsContent value="custom" className="mt-4 space-y-5">
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pdf-quality">Quality level</Label>
                    <span className="text-sm font-semibold text-indigo-600">{customQuality}%</span>
                  </div>
                  <Slider
                    id="pdf-quality"
                    value={[customQuality]}
                    min={10}
                    max={95}
                    step={5}
                    onValueChange={(values) => setCustomQuality(values[0])}
                  />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
                  <div>
                    <Label htmlFor="remove-metadata" className="text-sm font-semibold text-slate-700">
                      Remove metadata
                    </Label>
                    <p className="text-xs text-slate-400">Strips author, title and creation history.</p>
                  </div>
                  <Switch id="remove-metadata" checked={removeMetadata} onCheckedChange={setRemoveMetadata} />
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
                  <div>
                    <Label htmlFor="downsample-images" className="text-sm font-semibold text-slate-700">
                      Downsample images
                    </Label>
                    <p className="text-xs text-slate-400">Reduces image resolution for a smaller file.</p>
                  </div>
                  <Switch id="downsample-images" checked={downsampleImages} onCheckedChange={setDownsampleImages} />
                </div>
              </TabsContent>

              <TabsContent value="target" className="mt-4 space-y-2.5">
                <Label htmlFor="target-size">Target file size (MB)</Label>
                <Input
                  id="target-size"
                  type="number"
                  min={0.05}
                  max={50}
                  step={0.05}
                  value={targetSize}
                  onChange={(event) => setTargetSize(event.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-slate-400">
                  The file is compressed step by step until it fits under your target, or as close as
                  possible.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleCompress}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Compress PDF
            </Button>
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
              <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
              Compression re-encodes pages as images — ideal for scans and image-heavy documents.
              Already-optimized text PDFs are returned with metadata cleanup only, never larger.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
