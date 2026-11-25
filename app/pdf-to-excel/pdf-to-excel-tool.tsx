"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileDropzone from "@/components/site/FileDropzone";
import FileChip from "@/components/site/FileChip";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";

export default function PdfToExcelTool() {
  const [file, setFile] = useState<File | null>(null);
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
    await run("/api/pdf-to-excel", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download Excel file"
        stats={[
          { label: "Original PDF", value: formatFileSize(file?.size ?? 0) },
          { label: "Excel workbook", value: formatFileSize(result.size) },
        ]}
        onReset={() => {
          setFile(null);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Extracting tables…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="Best results come from PDFs with clear tables and aligned columns."
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
        <Button
          onClick={handleConvert}
          disabled={isProcessing}
          className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
        >
          Convert to Excel
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
        Columns are detected from text positions, so neatly aligned tables convert best. Scanned
        PDFs without selectable text cannot be converted.
      </p>
    </>
  );
}
