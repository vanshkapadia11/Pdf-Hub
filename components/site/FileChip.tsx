"use client";

import { FileText, Image as ImageIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize } from "@/lib/client/api";

interface FileChipProps {
  name: string;
  size: number;
  onRemove?: () => void;
  className?: string;
}

/** A single selected-file row with type icon, name, size and remove button. */
export default function FileChip({ name, size, onRemove, className }: FileChipProps) {
  const isImage = /\.(png|jpe?g|webp|gif|tiff?|avif|svg)$/i.test(name);
  const Icon = isImage ? ImageIcon : FileText;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/90 px-4 py-3",
        className
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-500 ring-1 ring-rose-100">
        <Icon size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-slate-700" title={name}>
          {name}
        </span>
        <span className="block text-xs text-slate-400">{formatFileSize(size)}</span>
      </span>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${name}`}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-500"
        >
          <X size={15} />
        </button>
      )}
    </div>
  );
}
