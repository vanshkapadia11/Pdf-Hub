"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";
const DEFAULTS = { brightness: 100, contrast: 100, saturate: 100 };

export default function AddFiltersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [brightness, setBrightness] = useState(DEFAULTS.brightness);
  const [contrast, setContrast] = useState(DEFAULTS.contrast);
  const [saturate, setSaturate] = useState(DEFAULTS.saturate);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  // One object URL per selected file, revoked on change/unmount.
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
    setBrightness(DEFAULTS.brightness);
    setContrast(DEFAULTS.contrast);
    setSaturate(DEFAULTS.saturate);
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|tiff?)$/i.test(picked.name)) {
      setError("Please select an image file.");
      return;
    }
    setFile(picked);
  };

  const hasChanges =
    brightness !== DEFAULTS.brightness || contrast !== DEFAULTS.contrast || saturate !== DEFAULTS.saturate;

  const handleApply = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("brightness", String(brightness / 100));
    formData.append("contrast", String(contrast / 100));
    formData.append("saturate", String(saturate / 100));
    await run("/api/add-filters", formData);
  };

  // CSS filter mirrors the server-side sharp pipeline closely enough for a
  // faithful live preview.
  const cssFilter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download filtered image"
        previewUrl={result.url}
        stats={[
          { label: "Brightness", value: `${brightness}%` },
          { label: "Contrast", value: `${contrast}%` },
          { label: "Saturation", value: `${saturate}%` },
          { label: "File size", value: formatFileSize(result.size) },
        ]}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Applying filters…" />}

      {!file ? (
        <FileDropzone
          label="Drop an image here, or click to browse"
          hint="JPG, PNG, WebP, GIF and TIFF — filters are applied at full resolution on download."
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
          <img
            src={previewUrl}
            alt="Filter preview"
            className="max-h-72 max-w-full rounded-lg object-contain shadow-sm"
            style={{ filter: cssFilter }}
          />
        </div>
      )}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Filters</CardTitle>
            <CardDescription>100% is the untouched original. The preview updates live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-brightness">Brightness</Label>
                <span className="text-sm font-semibold text-indigo-600">{brightness}%</span>
              </div>
              <Slider
                id="filter-brightness"
                value={[brightness]}
                min={0}
                max={200}
                step={5}
                onValueChange={(values) => setBrightness(values[0])}
              />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-contrast">Contrast</Label>
                <span className="text-sm font-semibold text-indigo-600">{contrast}%</span>
              </div>
              <Slider
                id="filter-contrast"
                value={[contrast]}
                min={0}
                max={200}
                step={5}
                onValueChange={(values) => setContrast(values[0])}
              />
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="filter-saturate">Saturation</Label>
                <span className="text-sm font-semibold text-indigo-600">{saturate}%</span>
              </div>
              <Slider
                id="filter-saturate"
                value={[saturate]}
                min={0}
                max={200}
                step={5}
                onValueChange={(values) => setSaturate(values[0])}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3 sm:flex-row">
            <Button
              onClick={handleApply}
              disabled={isProcessing || !hasChanges}
              className="h-12 flex-1 bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Apply filters
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setBrightness(DEFAULTS.brightness);
                setContrast(DEFAULTS.contrast);
                setSaturate(DEFAULTS.saturate);
              }}
              disabled={isProcessing || !hasChanges}
              className="h-12 font-semibold"
            >
              <RotateCcw size={15} className="mr-1.5" />
              Reset
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
