"use client";

import { useEffect, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";

interface PageSelectionToolProps {
  endpoint: string;
  fieldName: "pagesToRemove" | "pagesToKeep";
  actionLabel: string;
  processingMessage: string;
  buttonLabel: string;
  downloadLabel: string;
  resultStats: (pageCount: number, selectionCount: number) => { label: string; value: string | number }[];
  resultNote?: (pageCount: number, selectionCount: number) => string;
  inputHint: (pageCount: number) => string;
}

/**
 * Shared engine for the "remove pages" and "extract pages" tools:
 * pick a PDF, type a page selection, submit.
 */
export default function PageSelectionTool({
  endpoint,
  fieldName,
  actionLabel,
  processingMessage,
  buttonLabel,
  downloadLabel,
  resultStats,
  resultNote,
  inputHint,
}: PageSelectionToolProps) {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [selection, setSelection] = useState("");
  const [reading, setReading] = useState(false);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  // Reset the selection whenever a new file is picked.
  useEffect(() => {
    setSelection("");
  }, [file]);

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

  const parsedSelection = () => {
    const pages = new Set<number>();
    for (const part of selection.split(",")) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes("-")) {
        const [start, end] = trimmed.split("-").map((n) => Number(n.trim()));
        if (Number.isInteger(start) && Number.isInteger(end) && start >= 1 && end >= start) {
          for (let i = start; i <= end; i++) pages.add(i);
        }
      } else {
        const n = Number(trimmed);
        if (Number.isInteger(n) && n >= 1) pages.add(n);
      }
    }
    return pages;
  };

  const selectionCount = parsedSelection().size;

  const handleSubmit = async () => {
    if (!file) return;
    if (selectionCount === 0) {
      setError("Enter at least one page number or range, e.g. 2 or 1-3,5.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append(fieldName, selection.replace(/\s/g, ""));
    await run(endpoint, formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel={downloadLabel}
        stats={resultStats(pageCount ?? 0, selectionCount)}
        note={resultNote?.(pageCount ?? 0, selectionCount)}
        onReset={() => {
          setFile(null);
          setPageCount(null);
          setSelection("");
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message={processingMessage} />}

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

      {file && pageCount !== null && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">{actionLabel}</CardTitle>
            <CardDescription>{inputHint(pageCount)}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="page-selection">Pages</Label>
              <Input
                id="page-selection"
                value={selection}
                onChange={(event) => setSelection(event.target.value)}
                placeholder="e.g. 2 or 1-3,5"
                className="h-11 font-mono text-base tracking-wide"
                autoComplete="off"
              />
              {selectionCount > 0 && (
                <p className="text-xs text-slate-400">
                  {selectionCount} page{selectionCount === 1 ? "" : "s"} selected
                  {pageCount > 0 ? ` out of ${pageCount}` : ""}
                </p>
              )}
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing || selectionCount === 0}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              {buttonLabel}
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
