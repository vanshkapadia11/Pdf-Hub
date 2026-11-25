"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob, infoHeader } from "@/hooks/use-tool-job";
import { formatFileSize, sizeReduction } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";

export default function CompressImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [mode, setMode] = useState<"percentage" | "filesize">("percentage");
  const [quality, setQuality] = useState(75);
  const [targetSize, setTargetSize] = useState("200");
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

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

  const handleCompress = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    if (mode === "filesize") {
      const target = Number(targetSize);
      if (!Number.isFinite(target) || target < 5) {
        setError("Target size must be at least 5 KB.");
        return;
      }
      formData.append("mode", "filesize");
      formData.append("targetSize", String(Math.round(target)));
    } else {
      formData.append("mode", "percentage");
      formData.append("quality", String(quality));
    }
    await run("/api/compress-image", formData);
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
        downloadLabel="Download compressed image"
        previewUrl={result.url}
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
      {isProcessing && <LoadingOverlay message="Compressing your image…" />}

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

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Compression settings</CardTitle>
            <CardDescription>Pick a quality level, or a target file size.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={mode} onValueChange={(value) => setMode(value as "percentage" | "filesize")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="percentage">By quality</TabsTrigger>
                <TabsTrigger value="filesize">By target size</TabsTrigger>
              </TabsList>
              <TabsContent value="percentage" className="mt-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-quality">Quality</Label>
                  <span className="text-sm font-semibold text-indigo-600">{quality}%</span>
                </div>
                <Slider
                  id="image-quality"
                  value={[quality]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(values) => setQuality(values[0])}
                />
                <p className="text-xs text-slate-400">
                  Lower quality means a smaller file. 60–80% works well for photos.
                </p>
              </TabsContent>
              <TabsContent value="filesize" className="mt-4 space-y-2.5">
                <Label htmlFor="target-size-kb">Target size (KB)</Label>
                <Input
                  id="target-size-kb"
                  type="number"
                  min={5}
                  step={5}
                  value={targetSize}
                  onChange={(event) => setTargetSize(event.target.value)}
                  className="h-11"
                />
                <p className="text-xs text-slate-400">
                  The image is re-encoded until it fits — quality is spent only as needed.
                </p>
              </TabsContent>
            </Tabs>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleCompress}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Compress image
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
