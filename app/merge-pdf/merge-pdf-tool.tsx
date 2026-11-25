"use client";

import { useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { FileText, GripVertical, Plus, X } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FileDropzone from "@/components/site/FileDropzone";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";
import { cn } from "@/lib/utils";

interface SelectedFile {
  id: string;
  file: File;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function isPdf(file: File) {
  try {
    const doc = await PDFDocument.load(await file.arrayBuffer());
    return doc.getPageCount() > 0;
  } catch {
    return false;
  }
}

function SortableRow({
  item,
  onRemove,
  disabled,
}: {
  item: SelectedFile;
  onRemove: (id: string) => void;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm",
        isDragging && "z-10 border-indigo-300 shadow-lg"
      )}
    >
      <button
        type="button"
        aria-label={`Reorder ${item.file.name}`}
        className="cursor-grab touch-none rounded-lg p-1 text-slate-400 transition-colors hover:text-indigo-600 active:cursor-grabbing"
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={17} />
      </button>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 ring-1 ring-rose-100">
        <FileText size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-700" title={item.file.name}>
          {item.file.name}
        </span>
        <span className="block text-xs text-slate-400">{formatFileSize(item.file.size)}</span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${item.file.name}`}
        onClick={() => onRemove(item.id)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export default function MergePdfTool() {
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [validating, setValidating] = useState(false);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addFiles = async (incoming: File[]) => {
    setError(null);
    const candidates = incoming.filter((f) => /\.pdf$/i.test(f.name) || f.type === "application/pdf");
    if (candidates.length === 0) {
      setError("Only PDF files can be merged. Please select .pdf files.");
      return;
    }
    setValidating(true);
    try {
      const valid: SelectedFile[] = [];
      const invalid: string[] = [];
      for (const file of candidates) {
        if (await isPdf(file)) {
          valid.push({ id: makeId(), file });
        } else {
          invalid.push(file.name);
        }
      }
      if (valid.length > 0) {
        setFiles((prev) => [...prev, ...valid]);
      }
      if (invalid.length > 0) {
        setError(
          `Could not read as a valid PDF: ${invalid.join(", ")}. Files may be corrupted or password protected.`
        );
      }
    } finally {
      setValidating(false);
    }
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((item) => item.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setFiles((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleMerge = async () => {
    if (files.length < 2) {
      setError("Add at least 2 PDF files to merge.");
      return;
    }
    const formData = new FormData();
    files.forEach((item) => formData.append("pdfs", item.file));
    await run("/api/merge-pdf", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download merged PDF"
        stats={[
          { label: "Files merged", value: files.length },
          { label: "Merged size", value: formatFileSize(result.size) },
        ]}
        onReset={() => {
          setFiles([]);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Merging your PDFs…" />}

      <FileDropzone
        label="Drop PDF files here, or click to browse"
        hint={`Add at least 2 PDFs — you can keep adding more. Max 50 MB per file.${files.length > 0 ? " Click the dropzone to add more files." : ""}`}
        accept="application/pdf,.pdf"
        multiple
        disabled={isProcessing || validating}
        onFiles={addFiles}
      />

      {error && <ErrorBox message={error} />}

      {files.length > 0 && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {files.length} file{files.length === 1 ? "" : "s"} selected
            </CardTitle>
            <CardDescription>Drag the grip icon to set the merge order (top to bottom).</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={files.map((item) => item.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2.5">
                  {files.map((item) => (
                    <SortableRow key={item.id} item={item} onRemove={removeFile} disabled={isProcessing} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleMerge}
              disabled={isProcessing || validating || files.length < 2}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <Plus size={17} className="mr-1.5" />
              Merge {files.length} PDFs
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFiles([])}
              disabled={isProcessing}
              className="text-sm font-medium text-slate-500"
            >
              Clear all
            </Button>
          </CardFooter>
        </Card>
      )}
    </>
  );
}
