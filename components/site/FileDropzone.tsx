"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { CloudUpload } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDropzoneProps {
  label: string;
  hint?: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles: (files: File[]) => void;
  className?: string;
}

/**
 * Consistent drag-and-drop upload area used by every tool page.
 */
export default function FileDropzone({
  label,
  hint,
  accept,
  multiple = false,
  disabled = false,
  onFiles,
  className,
}: FileDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const [dragActive, setDragActive] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      const files = Array.from(fileList);
      onFiles(multiple ? files : files.slice(0, 1));
    },
    [multiple, onFiles]
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
    // Allow selecting the same file again after an error.
    event.target.value = "";
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    if (!disabled) handleFiles(event.dataTransfer.files);
  };

  return (
    <label
      htmlFor={inputId}
      data-drag-active={dragActive}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragActive(true);
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={handleDrop}
      className={cn("dropzone", disabled && "pointer-events-none opacity-60", className)}
    >
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={handleChange}
        className="sr-only"
      />
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 ring-1 ring-indigo-100">
        <CloudUpload size={26} strokeWidth={1.8} />
      </span>
      <span className="text-base font-semibold text-slate-700">{label}</span>
      {hint && <span className="max-w-md text-sm text-slate-400">{hint}</span>}
    </label>
  );
}
