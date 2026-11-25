import Link from "next/link";
import {
  ArrowRight,
  CloudUpload,
  FileText,
  Gauge,
  Image as ImageIcon,
  Lock,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import ToolCard from "@/components/site/ToolCard";
import { CATEGORY_META, POPULAR_TOOLS, TOOLS, toolsByCategory } from "@/lib/tools";

const STATS = [
  { icon: Zap, label: "Instant processing", value: "No queues, no waiting" },
  { icon: Lock, label: "Files never stored", value: "Processed on demand" },
  { icon: Sparkles, label: "Completely free", value: "No sign-up, no limits" },
];

const FLOATING_ICONS = [
  { icon: FileText, className: "left-[6%] top-[16%] animate-float", color: "text-rose-300" },
  { icon: ImageIcon, className: "right-[8%] top-[22%] animate-float-delayed", color: "text-violet-300" },
  { icon: Wand2, className: "left-[14%] bottom-[14%] animate-float-delayed", color: "text-amber-300" },
  { icon: Gauge, className: "right-[13%] bottom-[10%] animate-float", color: "text-sky-300" },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      {/* Hero */}
      <main className="flex-1">
        <section className="relative overflow-hidden">
          {/* Floating decorative icons (hidden on small screens). */}
          {FLOATING_ICONS.map(({ icon: Icon, className, color }) => (
            <Icon
              key={className}
              size={54}
              aria-hidden
              className={`pointer-events-none absolute hidden opacity-70 lg:block ${className} ${color}`}
            />
          ))}

          <div className="container-page relative py-16 text-center sm:py-24">
            <div className="fade-in-up inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50/70 px-4 py-1.5 text-xs font-semibold text-indigo-700">
              <Sparkles size={14} />
              {TOOLS.length} tools · free forever · no sign-up
            </div>

            <h1 className="fade-in-up mx-auto mt-6 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Every document tool,
              <br />
              <span className="text-gradient">one clean workspace.</span>
            </h1>

            <p className="fade-in-up mx-auto mt-5 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg">
              Merge, split, compress and convert PDFs — plus a complete image
              toolkit for cropping, resizing and KYC-ready compression. Fast,
              private and free.
            </p>

            <div className="fade-in-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button
                asChild
                size="lg"
                className="bg-brand-gradient h-12 px-7 text-base font-semibold text-white shadow-lg shadow-indigo-200 transition-transform hover:-translate-y-0.5"
              >
                <Link href="/more">
                  Browse all tools
                  <ArrowRight size={18} className="ml-1.5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-12 px-7 text-base font-semibold">
                <Link href="/merge-pdf">
                  <CloudUpload size={18} className="mr-1.5 text-indigo-500" />
                  Merge a PDF now
                </Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="fade-in-up mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-3">
              {STATS.map(({ icon: Icon, label, value }) => (
                <div
                  key={label}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-5 py-4 text-left shadow-sm"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 ring-1 ring-indigo-100">
                    <Icon size={18} />
                  </span>
                  <span>
                    <span className="block text-sm font-bold text-slate-800">{label}</span>
                    <span className="block text-xs text-slate-400">{value}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Popular tools */}
        <section className="container-page py-10">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Popular tools</h2>
              <p className="mt-1 text-sm text-slate-500">The ones people reach for every day.</p>
            </div>
            <Link
              href="/more"
              className="hidden items-center gap-1 text-sm font-semibold text-indigo-600 transition-colors hover:text-indigo-800 sm:flex"
            >
              View all
              <ArrowRight size={15} />
            </Link>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {POPULAR_TOOLS.map((tool) => (
              <ToolCard key={tool.slug} tool={tool} />
            ))}
          </div>
        </section>

        {/* All tools by category */}
        <section className="container-page pb-16">
          {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
            const meta = CATEGORY_META[category];
            return (
              <div key={category} className="mt-10">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ring-1 ${meta.chipClass}`}
                  >
                    <meta.icon size={17} />
                  </span>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-slate-900">{meta.label}</h2>
                    <p className="text-sm text-slate-500">{meta.description}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {toolsByCategory(category).map((tool) => (
                    <ToolCard key={tool.slug} tool={tool} />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      </main>

      <Footer />
    </div>
  );
}
