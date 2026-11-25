import Link from "next/link";
import { FileText, ShieldCheck, Zap, Heart } from "lucide-react";
import { CATEGORY_META, toolsByCategory } from "@/lib/tools";

const Footer = () => {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t border-slate-200/70 bg-white/60 backdrop-blur-sm">
      <div className="container-page py-12">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
                <FileText size={18} strokeWidth={2.2} />
              </span>
              <span className="text-lg font-bold tracking-tight text-slate-900">PDF&nbsp;Hub</span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-500">
              A free, privacy-friendly document toolkit. Your files are processed
              on demand and never stored.
            </p>
            <ul className="mt-5 space-y-2 text-sm text-slate-500">
              <li className="flex items-center gap-2">
                <Zap size={14} className="text-indigo-500" />
                Fast, no sign-up
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck size={14} className="text-emerald-500" />
                Files never stored
              </li>
            </ul>
          </div>

          {/* Tool links by category */}
          {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <nav key={category} aria-label={meta.label}>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {meta.label}
                </h3>
                <ul className="mt-4 space-y-2.5">
                  {toolsByCategory(category).map((tool) => (
                    <li key={tool.slug}>
                      <Link
                        href={tool.href}
                        className="text-sm text-slate-600 transition-colors hover:text-indigo-600"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-slate-200/70 pt-6 text-sm text-slate-500 sm:flex-row">
          <p>© {year} PDF Hub. All rights reserved.</p>
          <p className="flex items-center gap-1.5">
            Made with <Heart size={13} className="text-rose-500" /> for people who
            just want their documents to work.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
