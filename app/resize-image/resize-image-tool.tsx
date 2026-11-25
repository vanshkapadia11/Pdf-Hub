"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";

export default function ResizeImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [method, setMethod] = useState<"pixels" | "percentage">("pixels");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [lockAspect, setLockAspect] = useState(true);
  const [percentage, setPercentage] = useState("50");
  const [outputFormat, setOutputFormat] = useState("auto");
  const [quality, setQuality] = useState(90);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const isImageFile = (f: File) =>
    f.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|tiff?)$/i.test(f.name);

  // Create/revoke the preview URL and read the natural dimensions.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    if (!isImageFile(picked)) {
      setError("Please select an image file.");
      return;
    }
    setFile(picked);
  };

  const applyAspect = (changed: "width" | "height", value: string) => {
    if (!lockAspect || !dimensions) {
      if (changed === "width") setWidth(value);
      else setHeight(value);
      return;
    }
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      if (changed === "width") setWidth(value);
      else setHeight(value);
      return;
    }
    if (changed === "width") {
      setWidth(String(Math.round(numeric)));
      setHeight(String(Math.round((numeric * dimensions.height) / dimensions.width)));
    } else {
      setHeight(String(Math.round(numeric)));
      setWidth(String(Math.round((numeric * dimensions.width) / dimensions.height)));
    }
  };

  const handleResize = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("outputFormat", outputFormat);
    formData.append("quality", String(quality));

    if (method === "pixels") {
      const widthValue = Number(width);
      const heightValue = Number(height);
      if (widthValue < 1 && heightValue < 1) {
        setError("Enter a width, a height, or both (at least 1px).");
        return;
      }
      formData.append("method", "pixels");
      formData.append("lockAspect", String(lockAspect));
      if (widthValue >= 1) formData.append("width", String(Math.round(widthValue)));
      if (heightValue >= 1) formData.append("height", String(Math.round(heightValue)));
    } else {
      const percentageValue = Number(percentage);
      if (!Number.isFinite(percentageValue) || percentageValue < 1 || percentageValue > 1000) {
        setError("Percentage must be between 1 and 1000.");
        return;
      }
      formData.append("method", "percentage");
      formData.append("percentage", String(Math.round(percentageValue)));
    }
    await run("/api/resize-image", formData);
  };

  if (result) {
    const lossy = outputFormat === "auto" ? /\.(jpe?g|webp)$/i.test(file?.name || "") : outputFormat !== "png";
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download resized image"
        previewUrl={result.url}
        stats={[
          {
            label: "Original",
            value: dimensions ? `${dimensions.width}×${dimensions.height}px` : "—",
          },
          {
            label: "New size",
            value: method === "percentage"
              ? dimensions
                ? `${Math.round((dimensions.width * Number(percentage)) / 100)}×${Math.round((dimensions.height * Number(percentage)) / 100)}px`
                : "—"
              : `${width || "auto"}×${height || "auto"}px`,
          },
          { label: "File size", value: formatFileSize(result.size) },
          ...(lossy ? [{ label: "Quality", value: `${quality}%` }] : []),
        ]}
        onReset={() => {
          setFile(null);
          setWidth("");
          setHeight("");
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Resizing your image…" />}

      {!file ? (
        <FileDropzone
          label="Drop an image here, or click to browse"
          hint="JPG, PNG, WebP, GIF and TIFF — up to 50 MB."
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
            alt="Preview"
            className="max-h-56 max-w-full rounded-lg object-contain shadow-sm"
          />
        </div>
      )}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Resize settings</CardTitle>
            <CardDescription>
              {dimensions
                ? `Current size: ${dimensions.width}×${dimensions.height}px.`
                : "Reading image dimensions…"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <RadioGroup
              value={method}
              onValueChange={(value) => setMethod(value as "pixels" | "percentage")}
              className="grid gap-2.5 sm:grid-cols-2"
            >
              <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                <RadioGroupItem value="pixels" />
                <span className="text-sm font-semibold text-slate-700">By pixels</span>
              </Label>
              <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                <RadioGroupItem value="percentage" />
                <span className="text-sm font-semibold text-slate-700">By percentage</span>
              </Label>
            </RadioGroup>

            {method === "pixels" ? (
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2.5">
                    <Label htmlFor="resize-width">Width (px)</Label>
                    <Input
                      id="resize-width"
                      type="number"
                      min={1}
                      placeholder="e.g. 1920"
                      value={width}
                      onChange={(event) => applyAspect("width", event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2.5">
                    <Label htmlFor="resize-height">Height (px)</Label>
                    <Input
                      id="resize-height"
                      type="number"
                      min={1}
                      placeholder="e.g. 1080"
                      value={height}
                      onChange={(event) => applyAspect("height", event.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
                  <div>
                    <Label htmlFor="lock-aspect" className="text-sm font-semibold text-slate-700">
                      Lock aspect ratio
                    </Label>
                    <p className="text-xs text-slate-400">
                      Height is computed automatically from the width.
                    </p>
                  </div>
                  <Switch
                    id="lock-aspect"
                    checked={lockAspect}
                    onCheckedChange={setLockAspect}
                    disabled={!dimensions}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="resize-percentage">Scale</Label>
                  <span className="text-sm font-semibold text-indigo-600">{percentage}%</span>
                </div>
                <Slider
                  id="resize-percentage"
                  value={[Number(percentage) || 50]}
                  min={5}
                  max={200}
                  step={5}
                  onValueChange={(values) => setPercentage(String(values[0]))}
                />
                {dimensions && (
                  <p className="text-xs text-slate-400">
                    Result: {Math.round((dimensions.width * Number(percentage)) / 100)}×
                    {Math.round((dimensions.height * Number(percentage)) / 100)}px
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label>Output format</Label>
                <Select value={outputFormat} onValueChange={setOutputFormat}>
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Same as input</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="jpg">JPG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {outputFormat !== "png" && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="resize-quality">Quality</Label>
                    <span className="text-sm font-semibold text-indigo-600">{quality}%</span>
                  </div>
                  <Slider
                    id="resize-quality"
                    value={[quality]}
                    min={30}
                    max={100}
                    step={5}
                    onValueChange={(values) => setQuality(values[0])}
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleResize}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Resize image
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
