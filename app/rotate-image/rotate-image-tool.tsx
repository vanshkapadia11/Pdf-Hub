"use client";

import { useEffect, useState } from "react";
import { FlipHorizontal, FlipVertical, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/*";
const ROTATIONS = [0, 90, 180, 270];

export default function RotateImageTool() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [rotate, setRotate] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
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
    setRotate(0);
    setFlipH(false);
    setFlipV(false);
    const picked = files[0];
    if (!picked) return;
    if (!picked.type.startsWith("image/") && !/\.(jpe?g|png|webp|gif|tiff?)$/i.test(picked.name)) {
      setError("Please select an image file.");
      return;
    }
    setFile(picked);
  };

  const handleRotate = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("image", file);
    formData.append("rotate", String(rotate));
    formData.append("flipH", String(flipH));
    formData.append("flipV", String(flipV));
    await run("/api/rotate-image", formData);
  };

  const hasTransform = rotate !== 0 || flipH || flipV;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download image"
        previewUrl={result.url}
        stats={[
          { label: "Rotation", value: `${rotate}°` },
          { label: "File size", value: formatFileSize(result.size) },
        ]}
        note={hasTransform ? undefined : "No rotation or flip was applied, so the file was simply re-encoded."}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Rotating your image…" />}

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
          {/* Live preview of the exact transform the API will apply. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Rotation preview"
            className="max-h-64 max-w-full rounded-lg object-contain shadow-sm transition-transform duration-300"
            style={{
              transform: `rotate(${rotate}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
            }}
          />
        </div>
      )}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Rotation & flips</CardTitle>
            <CardDescription>Pick a rotation step and any flips — the preview updates live.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label>Rotation</Label>
              <ToggleGroup
                type="single"
                value={String(rotate)}
                onValueChange={(value) => {
                  if (value) setRotate(Number(value));
                }}
                className="grid w-full grid-cols-4 gap-2"
              >
                {ROTATIONS.map((degrees) => (
                  <ToggleGroupItem
                    key={degrees}
                    value={String(degrees)}
                    className="h-11 gap-1.5 rounded-xl border border-slate-200 data-[state=on]:border-indigo-300 data-[state=on]:bg-indigo-50 data-[state=on]:text-indigo-700"
                  >
                    <RotateCw size={14} />
                    {degrees}°
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            <div className="grid gap-2.5 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
                <div className="flex items-center gap-2.5">
                  <FlipHorizontal size={17} className="text-slate-400" />
                  <div>
                    <Label htmlFor="flip-h" className="text-sm font-semibold text-slate-700">
                      Flip horizontal
                    </Label>
                    <p className="text-xs text-slate-400">Mirror left ↔ right</p>
                  </div>
                </div>
                <Switch id="flip-h" checked={flipH} onCheckedChange={setFlipH} />
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
                <div className="flex items-center gap-2.5">
                  <FlipVertical size={17} className="text-slate-400" />
                  <div>
                    <Label htmlFor="flip-v" className="text-sm font-semibold text-slate-700">
                      Flip vertical
                    </Label>
                    <p className="text-xs text-slate-400">Mirror top ↕ bottom</p>
                  </div>
                </div>
                <Switch id="flip-v" checked={flipV} onCheckedChange={setFlipV} />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleRotate}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Apply rotation & flips
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
