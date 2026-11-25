"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { CATEGORY_META, toolsByCategory } from "@/lib/tools";
import { cn } from "@/lib/utils";

/**
 * "More tools" rail shown next to every tool page. Rendered from the
 * central tool registry, so links can never go stale.
 */
const MoreToolsSidebar = ({ currentHref }: { currentHref?: string }) => {
  const pathname = usePathname();
  const activeHref = currentHref ?? pathname;

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
        More tools
      </h2>
      <div className="mt-4 space-y-5">
        {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
          const categoryTools = toolsByCategory(category).filter((tool) => tool.href !== activeHref);
          if (categoryTools.length === 0) return null;
          const meta = CATEGORY_META[category];
          return (
            <div key={category}>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                <meta.icon size={13} className="text-slate-400" />
                {meta.label}
              </p>
              <ul className="mt-2 space-y-1">
                {categoryTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={tool.href}
                      className="group flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-sm text-slate-600 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      <span className="flex items-center gap-2 truncate">
                        <tool.icon size={14} className="shrink-0 text-slate-400 group-hover:text-indigo-500" />
                        <span className="truncate">{tool.name}</span>
                      </span>
                      <ArrowRight
                        size={13}
                        className="shrink-0 text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      <Link
        href="/more"
        className={cn(
          "mt-5 flex items-center justify-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-2.5",
          "text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100"
        )}
      >
        <LayoutGrid size={15} />
        View all tools
      </Link>
    </div>
  );
};

export default MoreToolsSidebar;
