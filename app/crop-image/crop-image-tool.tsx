"use client";

import { useEffect, useState } from "react";
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
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";

export default function CropImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [x, setX] = useState("0");
  const [y, setY] = useState("0");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [outputFormat, setOutputFormat] = useState("auto");
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      setDimensions(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      // Default the crop area to the full image.
      setX("0");
      setY("0");
      setWidth(String(img.naturalWidth));
      setHeight(String(img.naturalHeight));
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleFile = (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|tiff?)$/i.test(picked.name)) {
      setError("Please select an image file.");
      return;
    }
    setFile(picked);
  };

  const numeric = {
    x: Number(x),
    y: Number(y),
    width: Number(width),
    height: Number(height),
  };
  const validRect =
    [numeric.x, numeric.y, numeric.width, numeric.height].every((v) => Number.isFinite(v) && v >= 0) &&
    numeric.width > 0 &&
    numeric.height > 0 &&
    (!dimensions || (numeric.x < dimensions.width && numeric.y < dimensions.height));

  const cropRectStyle = dimensions && validRect
    ? {
        left: `${(numeric.x / dimensions.width) * 100}%`,
        top: `${(numeric.y / dimensions.height) * 100}%`,
        width: `${Math.min(numeric.width / dimensions.width, 1) * 100}%`,
        height: `${Math.min(numeric.height / dimensions.height, 1) * 100}%`,
      }
    : undefined;

  const handleCrop = async () => {
    if (!file) return;
    if (!validRect) {
      setError(
        dimensions
          ? `The crop area must be inside the image (0–${dimensions.width}px wide, 0–${dimensions.height}px tall).`
          : "Enter a valid crop area."
      );
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    formData.append("x", String(Math.round(numeric.x)));
    formData.append("y", String(Math.round(numeric.y)));
    formData.append("width", String(Math.round(numeric.width)));
    formData.append("height", String(Math.round(numeric.height)));
    if (outputFormat !== "auto") formData.append("outputFormat", outputFormat);
    await run("/api/crop-image", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download cropped image"
        previewUrl={result.url}
        stats={[
          { label: "Crop area", value: `${Math.round(numeric.width)}×${Math.round(numeric.height)}px` },
          { label: "File size", value: formatFileSize(result.size) },
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
      {isProcessing && <LoadingOverlay message="Cropping your image…" />}

      {!file ? (
        <FileDropzone
          label="Drop an image here, or click to browse"
          hint="The crop area defaults to the full image — trim it down with the fields below."
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

      {file && previewUrl && dimensions && (
        <div className="flex items-center justify-center rounded-2xl border border-slate-200/70 bg-[repeating-conic-gradient(#f1f5f9_0%_25%,#ffffff_0%_50%)] bg-[length:20px_20px] p-4">
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Crop preview" className="max-h-64 max-w-full rounded-lg object-contain" />
            {cropRectStyle && (
              <div
                className="pointer-events-none absolute border-2 border-indigo-500 bg-indigo-500/15 shadow-[0_0_0_9999em_rgba(255,255,255,0.45)]"
                style={cropRectStyle}
              />
            )}
          </div>
        </div>
      )}

      {file && dimensions && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Crop area</CardTitle>
            <CardDescription>
              Image is {dimensions.width}×{dimensions.height}px. The origin (0,0) is the top-left corner.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="crop-x">X position (px)</Label>
                <Input
                  id="crop-x"
                  type="number"
                  min={0}
                  max={dimensions.width - 1}
                  value={x}
                  onChange={(event) => setX(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="crop-y">Y position (px)</Label>
                <Input
                  id="crop-y"
                  type="number"
                  min={0}
                  max={dimensions.height - 1}
                  value={y}
                  onChange={(event) => setY(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="crop-width">Width (px)</Label>
                <Input
                  id="crop-width"
                  type="number"
                  min={1}
                  max={dimensions.width}
                  value={width}
                  onChange={(event) => setWidth(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="crop-height">Height (px)</Label>
                <Input
                  id="crop-height"
                  type="number"
                  min={1}
                  max={dimensions.height}
                  value={height}
                  onChange={(event) => setHeight(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>

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
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCrop}
              disabled={isProcessing || !validRect}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Crop image
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
