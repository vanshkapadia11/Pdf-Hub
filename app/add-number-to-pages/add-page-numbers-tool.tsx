"use client";

import { useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";

const POSITIONS = [
  { value: "bottom-center", label: "Bottom center" },
  { value: "bottom-left", label: "Bottom left" },
  { value: "bottom-right", label: "Bottom right" },
  { value: "top-center", label: "Top center" },
  { value: "top-left", label: "Top left" },
  { value: "top-right", label: "Top right" },
];

export default function AddPageNumbersTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [position, setPosition] = useState("bottom-center");
  const [startPage, setStartPage] = useState("1");
  const [startNumber, setStartNumber] = useState("1");
  const [pageFormat, setPageFormat] = useState("page_of_total");
  const [fontColor, setFontColor] = useState("black");
  const [reading, setReading] = useState(false);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const handleFile = async (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    setReading(true);
    try {
      const doc = await PDFDocument.load(await picked.arrayBuffer());
      setFile(picked);
      setPageCount(doc.getPageCount());
    } catch {
      setFile(null);
      setPageCount(null);
      setError("This file could not be read as a PDF. It may be corrupted or password protected.");
    } finally {
      setReading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const startPageValue = Number(startPage);
    const startNumberValue = Number(startNumber);
    if (!Number.isInteger(startPageValue) || startPageValue < 1) {
      setError("Start page must be 1 or greater.");
      return;
    }
    if (!Number.isInteger(startNumberValue) || startNumberValue < 1) {
      setError("Start number must be 1 or greater.");
      return;
    }
    if (pageCount !== null && startPageValue > pageCount) {
      setError(`This document only has ${pageCount} pages, so numbering cannot start at page ${startPageValue}.`);
      return;
    }

    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("position", position);
    formData.append("startPage", startPage);
    formData.append("startNumber", startNumber);
    formData.append("pageFormat", pageFormat);
    formData.append("fontColor", fontColor);
    await run("/api/add-page-numbers", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download numbered PDF"
        stats={[
          { label: "Pages numbered", value: pageCount !== null ? pageCount - Number(startPage) + 1 : "—" },
          { label: "First number shown", value: startNumber },
        ]}
        onReset={() => {
          setFile(null);
          setPageCount(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Adding page numbers…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Max 50 MB. The page count is read right in your browser."
          accept="application/pdf,.pdf"
          disabled={reading}
          onFiles={handleFile}
        />
      ) : (
        <FileChip
          name={file.name}
          size={file.size}
          onRemove={() => {
            setFile(null);
            setPageCount(null);
            setError(null);
          }}
        />
      )}

      {error && <ErrorBox message={error} />}

      {file && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Numbering options</CardTitle>
            <CardDescription>
              {pageCount !== null
                ? `This document has ${pageCount} page${pageCount === 1 ? "" : "s"}.`
                : "Configure where and how numbers appear."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label>Position</Label>
              <Select value={position} onValueChange={setPosition}>
                <SelectTrigger className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {POSITIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="start-page">Start numbering at page</Label>
                <Input
                  id="start-page"
                  type="number"
                  min={1}
                  max={pageCount ?? undefined}
                  value={startPage}
                  onChange={(event) => setStartPage(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="start-number">First number shown</Label>
                <Input
                  id="start-number"
                  type="number"
                  min={1}
                  value={startNumber}
                  onChange={(event) => setStartNumber(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label>Number format</Label>
              <RadioGroup value={pageFormat} onValueChange={setPageFormat} className="grid gap-2.5 sm:grid-cols-2">
                <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                  <RadioGroupItem value="page_of_total" />
                  <span className="text-sm font-medium text-slate-700">3 of 12</span>
                </Label>
                <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                  <RadioGroupItem value="plain" />
                  <span className="text-sm font-medium text-slate-700">3</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2.5">
              <Label>Text color</Label>
              <RadioGroup value={fontColor} onValueChange={setFontColor} className="grid gap-2.5 sm:grid-cols-2">
                <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                  <RadioGroupItem value="black" />
                  <span className="text-sm font-medium text-slate-700">Black — for light pages</span>
                </Label>
                <Label className="flex cursor-pointer items-center gap-2.5 rounded-xl border border-slate-200/70 p-3 transition-colors has-[button[data-state=checked]]:border-indigo-300 has-[button[data-state=checked]]:bg-indigo-50/50">
                  <RadioGroupItem value="white" />
                  <span className="text-sm font-medium text-slate-700">White — for dark pages</span>
                </Label>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Add page numbers
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
