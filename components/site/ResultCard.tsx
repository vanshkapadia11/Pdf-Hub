"use client";

import { CheckCircle2, Download, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultCardProps {
  filename: string;
  downloadUrl: string;
  downloadLabel?: string;
  /** Optional stats rows (label + value) shown above the actions. */
  stats?: { label: string; value: React.ReactNode }[];
  note?: string;
  onReset?: () => void;
  resetLabel?: string;
  /** Optional preview image for image results. */
  previewUrl?: string;
}

/** Success card with download + "process another file" actions. */
export default function ResultCard({
  filename,
  downloadUrl,
  downloadLabel = "Download",
  stats,
  note,
  onReset,
  resetLabel = "Process another file",
  previewUrl,
}: ResultCardProps) {
  return (
    // @container: layout adapts to the CARD's own width, not the viewport.
    // The old viewport-based sm:flex-row squeezed the middle column into
    // ~120px whenever the page content was 640-1150px wide (laptop windows,
    // or desktop with the tool sidebar taking 280px), wrapping stats into
    // colliding text. Below @3xl (768px card width) everything stacks
    // vertically instead, which is always readable.
    <div className="fade-in-up @container rounded-2xl border border-emerald-200/70 bg-gradient-to-b from-emerald-50 to-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-5 @3xl:flex-row @3xl:items-center">
        {previewUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Result preview"
            className="mx-auto h-24 w-24 shrink-0 rounded-xl border border-slate-200 object-cover shadow-sm @3xl:mx-0 @3xl:h-28 @3xl:w-28"
          />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 size={22} className="shrink-0 text-emerald-500" />
            <p className="text-base font-bold text-slate-800">
              Your file is ready
            </p>
          </div>
          <p
            className="mt-1.5 truncate text-sm font-medium text-slate-600"
            title={filename}
          >
            {filename}
          </p>

          {stats && stats.length > 0 && (
            // Label stacked above its value (never fights for one line) and
            // auto-fit cells that never drop below 10rem wide, so values
            // wrap cleanly instead of colliding with neighbouring labels.
            <dl className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] gap-x-6 gap-y-3 text-sm">
              {stats.map((stat) => (
                <div key={stat.label} className="min-w-0">
                  <dt className="text-xs uppercase tracking-wide text-slate-500">
                    {stat.label}
                  </dt>
                  <dd className="mt-0.5 font-semibold text-slate-800">
                    {stat.value}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 @3xl:flex-row @3xl:justify-end">
          <Button
            asChild
            className="bg-brand-gradient font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5"
          >
            <a href={downloadUrl} download={filename}>
              <Download size={16} className="mr-1.5" />
              {downloadLabel}
            </a>
          </Button>
          {onReset && (
            <Button
              variant="outline"
              onClick={onReset}
              className="font-semibold"
            >
              <RotateCcw size={15} className="mr-1.5" />
              {resetLabel}
            </Button>
          )}
        </div>
      </div>

      {note && (
        <p className="mt-4 rounded-lg bg-indigo-50/80 px-3.5 py-2.5 text-xs leading-relaxed text-indigo-700">
          {note}
        </p>
      )}
    </div>
  );
}
