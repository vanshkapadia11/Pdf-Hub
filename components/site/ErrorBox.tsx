"use client";

import { AlertCircle } from "lucide-react";

/** Inline error box shown when a tool request fails. */
export default function ErrorBox({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3.5"
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-500" />
      <div className="min-w-0 text-sm leading-relaxed text-rose-700">
        <p className="font-semibold">Something went wrong</p>
        <p className="mt-0.5 break-words">{message}</p>
      </div>
    </div>
  );
}
