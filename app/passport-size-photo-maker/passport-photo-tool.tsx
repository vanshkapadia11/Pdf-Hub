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
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,image/*";

const PHOTO_PRESETS = [
  { value: "35x45", label: "35×45 mm — Indian passport", width: 35, height: 45 },
  { value: "2x2", label: "2×2 inch (51×51 mm) — US visa", width: 51, height: 51 },
  { value: "25x35", label: "25×35 mm — visa stamp size", width: 25, height: 35 },
  { value: "custom", label: "Custom size", width: 35, height: 45 },
];

const PAPER_PRESETS = [
  { value: "a4", label: "A4 (210×297 mm)", width: 210, height: 297 },
  { value: "a3", label: "A3 (297×420 mm)", width: 297, height: 420 },
  { value: "4x6", label: "4×6 inch photo paper", width: 152, height: 102 },
  { value: "custom", label: "Custom paper", width: 210, height: 297 },
];

export default function PassportPhotoTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoPreset, setPhotoPreset] = useState("35x45");
  const [photoWidth, setPhotoWidth] = useState("35");
  const [photoHeight, setPhotoHeight] = useState("45");
  const [paperPreset, setPaperPreset] = useState("a4");
  const [paperWidth, setPaperWidth] = useState("210");
  const [paperHeight, setPaperHeight] = useState("297");
  const [copies, setCopies] = useState("8");
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

  const applyPhotoPreset = (value: string) => {
    setPhotoPreset(value);
    const preset = PHOTO_PRESETS.find((option) => option.value === value);
    if (preset) {
      setPhotoWidth(String(preset.width));
      setPhotoHeight(String(preset.height));
    }
  };

  const applyPaperPreset = (value: string) => {
    setPaperPreset(value);
    const preset = PAPER_PRESETS.find((option) => option.value === value);
    if (preset) {
      setPaperWidth(String(preset.width));
      setPaperHeight(String(preset.height));
    }
  };

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
      setError("Photos must be 10 MB or smaller.");
      return;
    }
    setFile(picked);
  };

  const handleGenerate = async () => {
    if (!file) return;
    const photoW = Number(photoWidth);
    const photoH = Number(photoHeight);
    const paperW = Number(paperWidth);
    const paperH = Number(paperHeight);
    const copiesValue = Number(copies);

    if (![photoW, photoH, paperW, paperH, copiesValue].every((v) => Number.isFinite(v))) {
      setError("All dimensions and the copies count must be numbers.");
      return;
    }
    if (photoW < 20 || photoW > 200 || photoH < 20 || photoH > 200) {
      setError("Photo dimensions must be between 20mm and 200mm.");
      return;
    }
    if (paperW < 100 || paperW > 500 || paperH < 100 || paperH > 500) {
      setError("Paper dimensions must be between 100mm and 500mm.");
      return;
    }
    if (copiesValue < 1 || copiesValue > 200) {
      setError("Copies must be between 1 and 200.");
      return;
    }
    if (photoW >= paperW || photoH >= paperH) {
      setError(`A ${Math.round(photoW)}×${Math.round(photoH)}mm photo does not fit on ${Math.round(paperW)}×${Math.round(paperH)}mm paper.`);
      return;
    }

    const formData = new FormData();
    formData.append("image", file);
    formData.append("photoWidth", String(photoW));
    formData.append("photoHeight", String(photoH));
    formData.append("paperWidth", String(paperW));
    formData.append("paperHeight", String(paperH));
    formData.append("copies", String(Math.round(copiesValue)));
    await run("/api/passport-photo-maker", formData);
  };

  const photosPlaced = result ? result.headers.get("X-Photos-Placed") : null;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download photo sheet"
        previewUrl={result.url}
        stats={[
          { label: "Photos on sheet", value: photosPlaced ?? copies },
          { label: "Sheet size", value: `${Math.round(Number(paperWidth))}×${Math.round(Number(paperHeight))}mm @ 300 DPI` },
          { label: "File size", value: formatFileSize(result.size) },
        ]}
        note={'Print at 100% scale (do not use "fit to page") and cut along the light gray guides.'}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Building your photo sheet…" />}

      {!file ? (
        <FileDropzone
          label="Drop a portrait photo here, or click to browse"
          hint="The subject is kept in frame automatically. JPG, PNG or WebP up to 10 MB."
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
          <img src={previewUrl} alt="Photo preview" className="max-h-56 max-w-full rounded-lg object-contain shadow-sm" />
        </div>
      )}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Sheet settings</CardTitle>
            <CardDescription>Photo size, paper size and how many copies to tile.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label>Photo size</Label>
              <Select value={photoPreset} onValueChange={applyPhotoPreset}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {photoPreset === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="photo-width" className="text-xs text-slate-400">
                      Width (mm)
                    </Label>
                    <Input
                      id="photo-width"
                      type="number"
                      min={20}
                      max={200}
                      value={photoWidth}
                      onChange={(event) => setPhotoWidth(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="photo-height" className="text-xs text-slate-400">
                      Height (mm)
                    </Label>
                    <Input
                      id="photo-height"
                      type="number"
                      min={20}
                      max={200}
                      value={photoHeight}
                      onChange={(event) => setPhotoHeight(event.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label>Paper size</Label>
              <Select value={paperPreset} onValueChange={applyPaperPreset}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAPER_PRESETS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {paperPreset === "custom" && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="paper-width" className="text-xs text-slate-400">
                      Width (mm)
                    </Label>
                    <Input
                      id="paper-width"
                      type="number"
                      min={100}
                      max={500}
                      value={paperWidth}
                      onChange={(event) => setPaperWidth(event.target.value)}
                      className="h-11"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="paper-height" className="text-xs text-slate-400">
                      Height (mm)
                    </Label>
                    <Input
                      id="paper-height"
                      type="number"
                      min={100}
                      max={500}
                      value={paperHeight}
                      onChange={(event) => setPaperHeight(event.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="copies">Copies wanted</Label>
              <Input
                id="copies"
                type="number"
                min={1}
                max={200}
                value={copies}
                onChange={(event) => setCopies(event.target.value)}
                className="h-11"
              />
              <p className="text-xs text-slate-400">
                The sheet fits as many as possible; extra copies beyond what fits are trimmed.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleGenerate}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Generate photo sheet
            </Button>
            <p className="flex items-start gap-2 rounded-lg bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-500">
              <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
              Photos are printed at 300 DPI with light gray cut guides around every copy, centered
              on the sheet.
            </p>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
