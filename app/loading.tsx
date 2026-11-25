import { Loader2 } from "lucide-react";

/** Route-level loading state shown while a page's RSC payload streams in. */
export default function RouteLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
        <p className="text-sm font-semibold text-slate-500">Loading…</p>
      </div>
    </div>
  );
}
