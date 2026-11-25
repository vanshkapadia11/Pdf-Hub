"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";

interface SelectedPdf {
  file: File;
  pageCount: number;
}

export default function SplitPdfTool() {
  const [selected, setSelected] = useState<SelectedPdf | null>(null);
  const [ranges, setRanges] = useState<string[]>([""]);
  const [reading, setReading] = useState(false);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const handleFile = async (files: File[]) => {
    setError(null);
    reset();
    setRanges([""]);
    const file = files[0];
    if (!file) return;
    if (!/\.pdf$/i.test(file.name) && file.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setReading(true);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      setSelected({ file, pageCount: doc.getPageCount() });
    } catch {
      setSelected(null);
      setError("This file could not be read as a PDF. It may be corrupted or password protected.");
    } finally {
      setReading(false);
    }
  };

  const updateRange = (index: number, value: string) => {
    setRanges((prev) => prev.map((range, i) => (i === index ? value : range)));
  };

  const validRanges = ranges.map((r) => r.trim()).filter((r) => r.length > 0);

  const handleSplit = async () => {
    if (!selected) return;
    if (validRanges.length === 0) {
      setError("Add at least one page range, e.g. 1-3.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", selected.file);
    formData.append("ranges", JSON.stringify(validRanges));
    await run("/api/split-pdf", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download ZIP"
        stats={[
          { label: "Documents created", value: validRanges.length },
          { label: "Source pages", value: selected?.pageCount ?? "—" },
        ]}
        note={`Each page range became a separate PDF inside the ZIP (${validRanges.join(", ")}).`}
        onReset={() => {
          setSelected(null);
          setRanges([""]);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Splitting your PDF…" />}

      {!selected ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Max 50 MB. The page count is read right in your browser."
          accept="application/pdf,.pdf"
          disabled={reading}
          onFiles={handleFile}
        />
      ) : (
        <FileChip
          name={selected.file.name}
          size={selected.file.size}
          onRemove={() => {
            setSelected(null);
            setRanges([""]);
            setError(null);
          }}
        />
      )}

      {error && <ErrorBox message={error} />}

      {selected && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Page ranges</CardTitle>
            <CardDescription>
              This document has {selected.pageCount} page{selected.pageCount === 1 ? "" : "s"}. Use formats
              like <code className="rounded bg-slate-100 px-1">1-3</code>,{" "}
              <code className="rounded bg-slate-100 px-1">4</code> or{" "}
              <code className="rounded bg-slate-100 px-1">5,7,9</code> — one range per field.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {ranges.map((range, index) => (
              <div key={index} className="flex items-center gap-2.5">
                <div className="flex-1">
                  <Label htmlFor={`range-${index}`} className="sr-only">
                    Page range {index + 1}
                  </Label>
                  <Input
                    id={`range-${index}`}
                    value={range}
                    onChange={(event) => updateRange(index, event.target.value)}
                    placeholder={`e.g. 1-${Math.min(3, selected.pageCount)}`}
                    className="h-11"
                    autoComplete="off"
                  />
                </div>
                {ranges.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remove this range"
                    onClick={() => setRanges((prev) => prev.filter((_, i) => i !== index))}
                    className="h-11 w-11 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                  >
                    <X size={16} />
                  </Button>
                )}
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => setRanges((prev) => [...prev, ""])}
              className="w-full border-dashed font-medium text-slate-500"
            >
              <Plus size={16} className="mr-1.5" />
              Add another range
            </Button>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSplit}
              disabled={isProcessing || validRanges.length === 0}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Split into {validRanges.length || ""} document{validRanges.length === 1 ? "" : "s"}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
