import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Tool } from "@/lib/tools";
import { CATEGORY_META } from "@/lib/tools";
import { cn } from "@/lib/utils";

/** Tool card used on the landing page and the tools directory. */
export default function ToolCard({ tool, className }: { tool: Tool; className?: string }) {
  const Icon = tool.icon;
  const category = CATEGORY_META[tool.category];

  return (
    <Link
      href={tool.href}
      className={cn(
        "group flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm transition-all duration-200",
        "hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/60",
        className
      )}
    >
      <span
        className={cn(
          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1",
          category.chipClass
        )}
      >
        <Icon size={20} strokeWidth={2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-2">
          <span className="font-semibold text-slate-800 transition-colors group-hover:text-indigo-700">
            {tool.name}
          </span>
          <ArrowUpRight
            size={16}
            className="shrink-0 text-slate-300 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-500"
          />
        </span>
        <span className="mt-1 block text-sm leading-relaxed text-slate-500">
          {tool.description}
        </span>
      </span>
    </Link>
  );
}
