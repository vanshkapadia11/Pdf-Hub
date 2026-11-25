"use client";

import { Loader2 } from "lucide-react";

/** Full-screen processing overlay with spinner and message. */
export default function LoadingOverlay({ message = "Processing your file…" }: { message?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-10 py-8 shadow-2xl">
        <Loader2 size={34} className="animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-700">{message}</p>
      </div>
    </div>
  );
}
