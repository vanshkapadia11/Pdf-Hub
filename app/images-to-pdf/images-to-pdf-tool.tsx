"use client";

import { useEffect, useRef, useState } from "react";
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
import { GripVertical, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import FileDropzone from "@/components/site/FileDropzone";
import LoadingOverlay from "@/components/site/LoadingOverlay";
import ErrorBox from "@/components/site/ErrorBox";
import ResultCard from "@/components/site/ResultCard";
import { useToolJob, infoHeader } from "@/hooks/use-tool-job";
import { formatFileSize } from "@/lib/client/api";
import { cn } from "@/lib/utils";

interface SelectedImage {
  id: string;
  file: File;
  /** Object URL created once per selected image; revoked on remove/unmount. */
  previewUrl: string;
}

const IMAGE_ACCEPT = ".jpg,.jpeg,.png,.webp,.gif,.tiff,.tif,image/jpeg,image/png,image/webp,image/gif,image/tiff";

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isImageFile(file: File) {
  return /\.(jpe?g|png|webp|gif|tiff?)$/i.test(file.name) || file.type.startsWith("image/");
}

function SortableImage({
  item,
  onRemove,
  disabled,
}: {
  item: SelectedImage;
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
        "group relative flex cursor-grab touch-none flex-col rounded-xl border border-slate-200/70 bg-white p-2 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging ? "z-10 border-indigo-400 shadow-lg" : "hover:shadow-md"
      )}
      {...attributes}
      {...listeners}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.previewUrl}
        alt={item.file.name}
        className="pointer-events-none h-28 w-full rounded-lg object-cover"
        draggable={false}
      />
      <span className="mt-1.5 flex items-center gap-1.5 px-1 text-xs">
        <GripVertical size={12} className="shrink-0 text-slate-300" />
        <span className="truncate font-medium text-slate-600" title={item.file.name}>
          {item.file.name}
        </span>
      </span>
      <button
        type="button"
        aria-label={`Remove ${item.file.name}`}
        onClick={(event) => {
          event.stopPropagation();
          onRemove(item.id);
        }}
        disabled={disabled}
        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md bg-slate-900/60 text-white opacity-0 transition-opacity hover:bg-rose-600 focus:opacity-100 group-hover:opacity-100"
      >
        <X size={13} />
      </button>
    </div>
  );
}

export default function ImagesToPdfTool() {
  const [images, setImages] = useState<SelectedImage[]>([]);
  const { isProcessing, error, result, run, reset, setError } = useToolJob();

  // Revoke every preview object URL on unmount.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  useEffect(() => {
    const snapshot = imagesRef.current;
    return () => {
      snapshot.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    };
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const addImages = (incoming: File[]) => {
    setError(null);
    const valid = incoming.filter(isImageFile);
    if (valid.length === 0) {
      setError("Please select image files (JPG, PNG, WebP, GIF or TIFF).");
      return;
    }
    setImages((prev) => [
      ...prev,
      ...valid.map((file) => ({ id: makeId(), file, previewUrl: URL.createObjectURL(file) })),
    ]);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearImages = () => {
    setImages((prev) => {
      prev.forEach((item) => URL.revokeObjectURL(item.previewUrl));
      return [];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setImages((prev) => {
        const oldIndex = prev.findIndex((item) => item.id === active.id);
        const newIndex = prev.findIndex((item) => item.id === over.id);
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const handleConvert = async () => {
    if (images.length === 0) {
      setError("Add at least one image to convert.");
      return;
    }
    const formData = new FormData();
    images.forEach((item) => formData.append("images", item.file));
    await run("/api/images-to-pdf", formData);
  };

  const skipped = result ? infoHeader(result.headers, "X-Skipped-Files") : null;

  if (result) {
    return (
      <ResultCard
        filename={result.filename}
        downloadUrl={result.url}
        downloadLabel="Download PDF"
        stats={[
          { label: "Images converted", value: images.length - Number(skipped || 0) },
          { label: "PDF size", value: formatFileSize(result.size) },
        ]}
        note="Each image became one page, automatically rotated to match its orientation."
        onReset={() => {
          clearImages();
          reset();
        }}
      />
    );
  }

  return (
    <>
      {isProcessing && <LoadingOverlay message="Building your PDF…" />}

      <FileDropzone
        label="Drop images here, or click to browse"
        hint="JPG, PNG, WebP, GIF and TIFF — add as many as you like."
        accept={IMAGE_ACCEPT}
        multiple
        disabled={isProcessing}
        onFiles={addImages}
        className={images.length > 0 ? "py-6" : undefined}
      />

      {error && <ErrorBox message={error} />}

      {images.length > 0 && (
        <Card className="border-slate-200/70 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {images.length} image{images.length === 1 ? "" : "s"} selected
            </CardTitle>
            <CardDescription>Drag the tiles to set the page order (left to right, top to bottom).</CardDescription>
          </CardHeader>
          <CardContent>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={images.map((item) => item.id)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                  {images.map((item) => (
                    <SortableImage key={item.id} item={item} onRemove={removeImage} disabled={isProcessing} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button
              onClick={handleConvert}
              disabled={isProcessing || images.length === 0}
              className="h-12 w-full bg-brand-gradient text-base font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
            >
              Convert {images.length} image{images.length === 1 ? "" : "s"} to PDF
            </Button>
            <Button
              variant="ghost"
              onClick={clearImages}
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
