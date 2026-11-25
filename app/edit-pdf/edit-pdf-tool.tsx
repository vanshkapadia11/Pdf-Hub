"use client";

import { useEffect, useState } from "react";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";

export default function EditPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [pageWidth, setPageWidth] = useState(595);
  const [pageHeight, setPageHeight] = useState(842);
  const [text, setText] = useState("");
  const [allPages, setAllPages] = useState(false);
  const [pageNumber, setPageNumber] = useState("1");
  const [x, setX] = useState("50");
  const [y, setY] = useState("50");
  const [fontSize, setFontSize] = useState("24");
  const [color, setColor] = useState("#e11d48");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; filename: string } | null>(null);

  // Revoke the object URL when replaced or on unmount.
  useEffect(() => {
    return () => {
      if (result) URL.revokeObjectURL(result.url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.url]);

  const handleFile = async (files: File[]) => {
    setError(null);
    if (result) {
      URL.revokeObjectURL(result.url);
      setResult(null);
    }
    const picked = files[0];
    if (!picked) return;
    if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") {
      setError("Please select a PDF file.");
      return;
    }
    try {
      const doc = await PDFDocument.load(await picked.arrayBuffer());
      setFile(picked);
      setPageCount(doc.getPageCount());
      const firstPage = doc.getPage(0);
      const size = firstPage.getSize();
      setPageWidth(Math.round(size.width));
      setPageHeight(Math.round(size.height));
    } catch {
      setFile(null);
      setPageCount(null);
      setError("This file could not be read as a PDF. It may be corrupted or password protected.");
    }
  };

  const reset = () => {
    if (result) URL.revokeObjectURL(result.url);
    setResult(null);
    setFile(null);
    setPageCount(null);
    setText("");
    setPageNumber("1");
    setX("50");
    setY("50");
    setFontSize("24");
    setColor("#e11d48");
    setAllPages(false);
    setError(null);
  };

  const hexToRgb = (hex: string) => {
    const match = hex.match(/^#?([0-9a-f]{6})$/i);
    if (!match) return rgb(0.88, 0.11, 0.28);
    const int = Number.parseInt(match[1], 16);
    return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
  };

  const handleAddText = async () => {
    if (!file) return;
    if (!text.trim()) {
      setError("Type some text to add first.");
      return;
    }
    const targetPage = allPages ? 1 : Number(pageNumber);
    if (!allPages && (!Number.isInteger(targetPage) || targetPage < 1)) {
      setError("Page number must be a positive whole number.");
      return;
    }
    if (pageCount !== null && !allPages && targetPage > pageCount) {
      setError(`This document only has ${pageCount} page${pageCount === 1 ? "" : "s"}.`);
      return;
    }
    const posX = Number(x);
    const posY = Number(y);
    const size = Number(fontSize);
    if (!Number.isFinite(posX) || !Number.isFinite(posY) || posX < 0 || posY < 0) {
      setError("X and Y must be 0 or greater.");
      return;
    }
    if (!Number.isFinite(size) || size < 6 || size > 96) {
      setError("Font size must be between 6 and 96.");
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      const doc = await PDFDocument.load(await file.arrayBuffer());
      const font = await doc.embedFont(StandardFonts.HelveticaBold);
      const pages = doc.getPages();

      const targets = allPages ? pages : [pages[targetPage - 1]];
      targets.forEach((page) => {
        page.drawText(text, {
          x: posX,
          y: posY,
          size,
          font,
          color: hexToRgb(color),
        });
      });

      const pdfBytes = await doc.save({ useObjectStreams: true });
      if (result) URL.revokeObjectURL(result.url);
      // Copy into a fresh ArrayBuffer so the Blob gets exact byte bounds.
      const arrayBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength
      ) as ArrayBuffer;
      const url = URL.createObjectURL(new Blob([arrayBuffer], { type: "application/pdf" }));
      setResult({
        url,
        filename: file.name.replace(/\.pdf$/i, "") + "-edited.pdf",
      });
    } catch {
      setError("Failed to add the text. The PDF may be corrupted or protected.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download edited PDF"
        stats={[
          { label: "Pages edited", value: allPages ? (pageCount ?? "all") : 1 },
          { label: "Text added", value: text.length > 24 ? `${text.slice(0, 24)}…` : text },
        ]}
        onReset={reset}
        resetLabel="Edit another file"
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Adding your text…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Your file never leaves the browser — editing runs locally."
          accept="application/pdf,.pdf"
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
            <CardTitle className="text-base">Text settings</CardTitle>
            <CardDescription>
              {pageCount !== null
                ? `${pageCount} pages · page size ≈ ${pageWidth}×${pageHeight} pt (origin is bottom-left).`
                : "Choose what to write and where."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="pdf-text">Text</Label>
              <Input
                id="pdf-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder="e.g. APPROVED — 25 Nov 2026"
                className="h-11"
                autoComplete="off"
              />
            </div>

            <div className="flex items-center justify-between rounded-xl border border-slate-200/70 p-3.5">
              <div>
                <Label htmlFor="all-pages" className="text-sm font-semibold text-slate-700">
                  Add to every page
                </Label>
                <p className="text-xs text-slate-400">Otherwise only the page chosen below.</p>
              </div>
              <Switch id="all-pages" checked={allPages} onCheckedChange={setAllPages} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="page-number">Page</Label>
                <Input
                  id="page-number"
                  type="number"
                  min={1}
                  max={pageCount ?? undefined}
                  value={pageNumber}
                  disabled={allPages}
                  onChange={(event) => setPageNumber(event.target.value)}
                  className="h-11 disabled:opacity-50"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="font-size">Font size</Label>
                <Input
                  id="font-size"
                  type="number"
                  min={6}
                  max={96}
                  value={fontSize}
                  onChange={(event) => setFontSize(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="pos-x">X position (pt from left)</Label>
                <Input
                  id="pos-x"
                  type="number"
                  min={0}
                  max={2000}
                  value={x}
                  onChange={(event) => setX(event.target.value)}
                  className="h-11"
                />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="pos-y">Y position (pt from bottom)</Label>
                <Input
                  id="pos-y"
                  type="number"
                  min={0}
                  max={2000}
                  value={y}
                  onChange={(event) => setY(event.target.value)}
                  className="h-11"
                />
              </div>
            </div>

            <div className="space-y-2.5">
              <Label htmlFor="text-color">Color</Label>
              <div className="flex items-center gap-3">
                <input
                  id="text-color"
                  type="color"
                  value={color}
                  onChange={(event) => setColor(event.target.value)}
                  className="h-11 w-16 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                />
                <span className="font-mono text-sm text-slate-500">{color}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleAddText}
              disabled={isProcessing || !text.trim()}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Add text to PDF
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
