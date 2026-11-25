"use client";

import { useCallback, useRef, useState } from "react";
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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FileDropzone from "@/components/site/FileDropzone";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob } from "@/hooks/use-tool-job";
import { cn } from "@/lib/utils";

interface PdfPage {
  /** Unique, stable id — independent of position, so drag-and-drop stays sane. */
  id: string;
  pageNumber: number;
  dataUrl: string;
}

const THUMBNAIL_SCALE = 0.35;

let pdfjsPromise: Promise<typeof import("pdfjs-dist/build/pdf.mjs")> | null = null;

async function loadPdfjs() {
  if (!pdfjsPromise) {
    pdfjsPromise = import("pdfjs-dist/build/pdf.mjs").then((pdfjs) => {
      // The matching worker file is served from /public.
      pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Renders every page of the PDF to a small thumbnail data URL. */
async function renderThumbnails(file: File, onProgress: (done: number, total: number) => void) {
  const pdfjs = await loadPdfjs();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: PdfPage[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const viewport = page.getViewport({ scale: THUMBNAIL_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas is not supported in this browser.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvasContext: context, viewport, canvas }).promise;
    page.cleanup();
    pages.push({ id: makeId(), pageNumber, dataUrl: canvas.toDataURL("image/jpeg", 0.8) });
    onProgress(pageNumber, doc.numPages);
  }
  await doc.destroy();
  return pages;
}

function SortablePage({
  page,
  index,
  disabled,
  onRemove,
}: {
  page: PdfPage;
  index: number;
  disabled: boolean;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: page.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "group relative rounded-xl border border-slate-200/80 bg-white p-2 shadow-sm transition-shadow",
        isDragging ? "z-20 border-indigo-400 shadow-xl" : "hover:shadow-md"
      )}
    >
      <button
        type="button"
        className="block w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label={`Page ${page.pageNumber} — drag to reorder`}
        disabled={disabled}
        {...attributes}
        {...listeners}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={page.dataUrl}
          alt={`Page ${page.pageNumber}`}
          className="pointer-events-none h-40 w-full rounded-lg object-contain"
          draggable={false}
        />
        <span className="mt-1.5 block text-center text-xs font-semibold text-slate-500">
          Page {page.pageNumber}
        </span>
      </button>
      <span className="absolute left-1.5 top-1.5 rounded-md bg-slate-900/70 px-1.5 py-0.5 text-[10px] font-bold text-white">
        {index + 1}
      </span>
      <button
        type="button"
        aria-label={`Delete page ${page.pageNumber}`}
        onClick={() => onRemove(page.id)}
        disabled={disabled}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-900/60 text-white opacity-0 transition-opacity hover:bg-rose-600 focus:opacity-100 group-hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function OrganizePdfTool() {
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<PdfPage[]>([]);
  const [rendering, setRendering] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [renderToken, setRenderToken] = useState(0);
  const tokenRef = useRef(0);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleFile = useCallback(
    async (files: File[]) => {
      setError(null);
      reset();
      const picked = files[0];
      if (!picked) return;
      if (!/\.pdf$/i.test(picked.name) && picked.type !== "application/pdf") {
        setError("Please select a PDF file.");
        return;
      }

      const token = ++tokenRef.current;
      setFile(picked);
      setPages([]);
      setRendering(true);
      setProgress({ done: 0, total: 0 });
      try {
        const rendered = await renderThumbnails(picked, (done, total) => {
          // Ignore renders from an abandoned (replaced) upload.
          if (tokenRef.current === token) setProgress({ done, total });
        });
        if (tokenRef.current === token) setPages(rendered);
      } catch {
        if (tokenRef.current === token) {
          setFile(null);
          setError(
            "This PDF could not be opened for preview. It may be corrupted or password protected."
          );
        }
      } finally {
        if (tokenRef.current === token) setRendering(false);
        setRenderToken((t) => t + 1);
      }
    },
    [reset, setError]
  );

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((page) => page.id !== id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPages((prev) => {
        const oldIndex = prev.findIndex((page) => page.id === active.id);
        const newIndex = prev.findIndex((page) => page.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleOrganize = async () => {
    if (!file || pages.length === 0) return;
    if (pages.length === 1) {
      setError("Keep at least one page in the document — delete the output you don't need instead.");
      return;
    }
    const formData = new FormData();
    formData.append("pdf", file);
    formData.append("newOrder", pages.map((page) => page.pageNumber).join(","));
    await run("/api/organize-pdf", formData);
  };

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download organized PDF"
        stats={[
          { label: "Pages in output", value: pages.length },
          { label: "New order", value: pages.map((page) => page.pageNumber).join(", ") },
        ]}
        onReset={() => {
          setFile(null);
          setPages([]);
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Rebuilding your PDF…" />}

      {!file ? (
        <FileDropzone
          label="Drop a PDF here, or click to browse"
          hint="A live thumbnail of every page is rendered right in your browser."
          accept="application/pdf,.pdf"
          disabled={rendering}
          onFiles={handleFile}
        />
      ) : (
        <FileDropzone
          label="Pick a different PDF"
          accept="application/pdf,.pdf"
          disabled={rendering || isProcessing}
          onFiles={handleFile}
          className="py-6"
        />
      )}

      {error && <ErrorBox message={error} />}

      {(rendering || pages.length > 0) && (
        <Card className="border-slate-200/70 shadow-sm" key={renderToken}>
          <CardHeader>
            <CardTitle className="text-base">
              {rendering ? "Rendering page previews…" : `${pages.length} pages`}
            </CardTitle>
            <CardDescription>
              {rendering
                ? `Rendering page ${progress.done} of ${progress.total}…`
                : "Drag the thumbnails to reorder, use the ✕ to delete a page. The number badge shows the new page position."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {rendering ? (
              <div className="flex items-center justify-center gap-3 rounded-xl border border-dashed border-slate-200 py-16 text-sm font-semibold text-slate-500">
                <Loader2 size={20} className="animate-spin text-indigo-500" />
                {progress.total > 0
                  ? `${progress.done} / ${progress.total} pages rendered`
                  : "Loading PDF…"}
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={pages.map((page) => page.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                    {pages.map((page, index) => (
                      <SortablePage
                        key={page.id}
                        page={page}
                        index={index}
                        disabled={isProcessing}
                        onRemove={removePage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
          {!rendering && (
            <CardFooter>
              <Button
                onClick={handleOrganize}
                disabled={isProcessing || pages.length === 0}
                className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                Save new page order
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </>
  );
}
