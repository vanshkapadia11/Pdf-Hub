"use client";

import { useEffect, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";
const FORMATS = ["png", "jpg", "webp"] as const;

export default function ConvertImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [format, setFormat] = useState<string>("png");
  const [quality, setQuality] = useState(90);
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
    if (!picked.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|tiff?)$/i.test(picked.name)) {
      setError("Please select an image file.");
      return;
    }
    setFile(picked);
  };

  const handleConvert = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("format", format);
    formData.append("quality", String(quality));
    await run("/api/convert-image", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel={`Download ${format.toUpperCase()}`}
        previewUrl={result.url}
        stats={[
          { label: "Original size", value: formatFileSize(file?.size ?? 0) },
          { label: "Converted size", value: formatFileSize(result.size) },
          ...(format !== "png" ? [{ label: "Quality", value: `${quality}%` }] : []),
        ]}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  const lossy = format !== "png";

  return (
    <>
      {isProcessing && <LoadingOverlay message="Converting your image…" />}

      {!file ? (
        <FileDropzone
          label="Drop an image here, or click to browse"
          hint="JPG, PNG, WebP, GIF and TIFF in — JPG, PNG or WebP out."
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
            <CardTitle className="text-base flex items-center gap-2">
              <ImageIcon size={17} className="text-indigo-500" />
              Output format
            </CardTitle>
            <CardDescription>Pick the format to convert into.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <ToggleGroup
              type="single"
              value={format}
              onValueChange={(value) => {
                if (value) setFormat(value);
              }}
              className="grid w-full grid-cols-3 gap-2"
            >
              {FORMATS.map((option) => (
                <ToggleGroupItem
                  key={option}
                  value={option}
                  className="h-12 rounded-xl border border-slate-200 text-sm font-semibold uppercase data-[state=on]:border-indigo-300 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-700"
                >
                  {option}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>

            {lossy && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="convert-quality">Quality</Label>
                  <span className="text-sm font-semibold text-indigo-600">{quality}%</span>
                </div>
                <Slider
                  id="convert-quality"
                  value={[quality]}
                  min={30}
                  max={100}
                  step={5}
                  onValueChange={(values) => setQuality(values[0])}
                />
                {format === "jpg" && (
                  <p className="text-xs text-slate-400">
                    Transparent areas become white in JPG (it has no alpha channel).
                  </p>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleConvert}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Convert to {format.toUpperCase()}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
