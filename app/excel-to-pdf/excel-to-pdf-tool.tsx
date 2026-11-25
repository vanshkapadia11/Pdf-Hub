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

const EXCEL_ACCEPT =
  ".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel";

export default function ExcelToPdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const handleFile = (files: File[]) => {
    setError(null);
    reset();
    const picked = files[0];
    if (!picked) return;
    const looksLikeExcel = /\.(xlsx|xls|xlsm)$/i.test(picked.name);
    if (!looksLikeExcel) {
      setError("Please select an Excel file (.xlsx or .xls).");
      return;
    }
    setFile(picked);
  };

  const handleConvert = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("excel", file);
    await run("/api/excel-to-pdf", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download PDF"
        stats={[
          { label: "Excel file", value: formatFileSize(file?.size ?? 0) },
          { label: "PDF output", value: formatFileSize(result.size) },
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
      {isProcessing && <LoadingOverlay message="Building your PDF table…" />}

      {!file ? (
        <FileDropzone
          label="Drop an Excel file here, or click to browse"
          hint="Supports .xlsx and .xls. The first worksheet is converted."
          accept={EXCEL_ACCEPT}
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
          Convert to PDF
        </Button>
      )}

      <p className="flex items-start gap-2 rounded-xl bg-slate-50 px-4 py-3 text-xs leading-relaxed text-slate-500">
        <Info size={14} className="mt-0.5 shrink-0 text-slate-400" />
        Wide tables are automatically rotated to landscape, and long cell text wraps instead of
        being cut off. Non-Latin characters are replaced with “?” (standard PDF fonts are used).
      </p>
    </>
  );
}
