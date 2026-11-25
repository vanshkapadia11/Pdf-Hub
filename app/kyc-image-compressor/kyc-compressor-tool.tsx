"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob, infoHeader } from "@/hooks/use-tool-job";
import { formatFileSize, sizeReduction } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/*";
const PRESETS = [
  { value: "50", label: "50 KB — strict KYC portals" },
  { value: "100", label: "100 KB — most bank forms" },
  { value: "200", label: "200 KB — government forms" },
  { value: "500", label: "500 KB — large documents" },
  { value: "custom", label: "Custom size" },
];

export default function KycCompressorTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [preset, setPreset] = useState("100");
  const [customKB, setCustomKB] = useState("100");
  const [outputFormat, setOutputFormat] = useState("jpeg");
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/") && !/\.(jpe?g|png|webp)$/i.test(picked.name)) {
      setError("Please select an image file (JPG, PNG or WebP).");
      return;
    }
    if (picked.size > 10 * 1024 * 1024) {
      setError("KYC images must be 10 MB or smaller.");
      return;
    }
    setFile(picked);
  };

  const targetKB = preset === "custom" ? Number(customKB) : Number(preset);

  const handleCompress = async () => {
    if (!file) return;
    if (!Number.isFinite(targetKB) || targetKB < 5 || targetKB > 2048) {
      setError("Target size must be between 5 KB and 2048 KB.");
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("targetSizeKB", String(Math.round(targetKB)));
    formData.append("outputFormat", outputFormat);
    await run("/api/kyc-compressor", formData);
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
        downloadLabel="Download optimized image"
        previewUrl={result.url}
        stats={[
          { label: "Target", value: `${Math.round(targetKB)} KB` },
          {
            label: "Result size",
            value: `${formatFileSize(compressedSize)} (${reduction > 0 ? `${reduction}% smaller` : "already within limit"})`,
          },
          { label: "Output format", value: outputFormat.toUpperCase() },
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
      {isProcessing && <LoadingOverlay message="Optimizing your image…" />}

      {!file ? (
        <FileDropzone
          label="Drop an image here, or click to browse"
          hint="JPG, PNG or WebP up to 10 MB — perfect for PAN, Aadhaar and passport documents."
          accept={IMAGE_ACCEPT}
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

      {file && previewUrl && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/70 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt="Preview" className="max-h-56 max-w-full rounded-lg object-contain shadow-sm" />
        </div>
      )}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Target size</CardTitle>
            <CardDescription>Pick a common KYC limit, or set your own in KB.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label>Preset limits</Label>
              <Select value={preset} onValueChange={setPreset}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="custom-kb">Custom target size (KB)</Label>
              <Input
                id="custom-kb"
                type="number"
                min={5}
                max={2048}
                step={5}
                value={preset === "custom" ? customKB : String(targetKB)}
                onChange={(event) => {
                  setCustomKB(event.target.value);
                  if (preset !== "custom") setPreset("custom");
                }}
                className="h-11"
              />
            </div>

            <div className="space-y-2.5">
              <Label>Output format</Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jpeg">JPG — accepted everywhere</SelectItem>
                  <SelectItem value="png">PNG — lossless format</SelectItem>
                  <SelectItem value="webp">WebP — modern portals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleCompress}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Compress to {targetKB} KB
            </Button>
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
              <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
              Quality is spent only as needed to fit under the limit, and transparency is flattened
              to white. If the target is unreachable, the smallest usable result is returned.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
