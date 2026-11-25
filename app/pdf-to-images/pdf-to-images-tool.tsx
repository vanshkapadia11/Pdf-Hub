"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const FORMATS = [
  { value: "jpeg", label: "JPG — smallest files" },
  { value: "png", label: "PNG — lossless" },
  { value: "webp", label: "WebP — modern & efficient" },
];

const DPI_OPTIONS = [
  { value: "96", label: "96 DPI — screen" },
  { value: "150", label: "150 DPI — balanced (recommended)" },
  { value: "200", label: "200 DPI — high" },
  { value: "300", label: "300 DPI — print" },
];

export default function PdfToImagesTool() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState("jpeg");
  const [quality, setQuality] = useState(90);
  const [dpi, setDpi] = useState("150");
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

  const handleConvert = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("format", format);
    formData.append("quality", String(quality));
    formData.append("dpi", dpi);
    await run("/api/pdf-to-images", formData);
  };

  const pageCount = result ? result.headers.get("X-Page-Count") : null;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download ZIP"
        stats={[
          { label: "Pages converted", value: pageCount ?? "all" },
          { label: "ZIP size", value: formatFileSize(result.size) },
        ]}
        note={`${pageCount ?? "All"} pages were exported as ${format.toUpperCase()} images at ${dpi} DPI inside the ZIP.`}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  const lossy = format === "jpeg" || format === "webp";

  return (
    <>
      {isProcessing && <LoadingOverlay message="Rendering pages…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Every page becomes an image — pick the format and resolution below."
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
            <CardTitle className="text-base">Export settings</CardTitle>
            <CardDescription>Choose the image format, quality and resolution.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label>Image format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FORMATS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2.5">
              <Label>Resolution</Label>
              <Select value={dpi} onValueChange={setDpi}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DPI_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {lossy && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="image-quality">Image quality</Label>
                  <span className="text-sm font-semibold text-indigo-600">{quality}%</span>
                </div>
                <Slider
                  id="image-quality"
                  value={[quality]}
                  min={30}
                  max={100}
                  step={5}
                  onValueChange={(values) => setQuality(values[0])}
                />
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleConvert}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Convert to images
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
