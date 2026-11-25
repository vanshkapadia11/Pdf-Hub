import type { Metadata } from "next";
import Navbar from "@/components/site/Navbar";
import Footer from "@/components/site/Footer";
import ToolCard from "@/components/site/ToolCard";
import { CATEGORY_META, TOOLS, toolsByCategory } from "@/lib/tools";

export const metadata: Metadata = {
  title: "All Tools",
  description: `Browse all ${TOOLS.length} free PDF, image and converter tools on PDF Hub.`,
};

export default function MorePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container-page flex-1 py-10 lg:py-14">
        <header className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            The complete <span className="text-gradient">toolbox</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-slate-500 sm:text-base">
            All {TOOLS.length} tools, grouped by what you are trying to do. Pick
            one and get straight to work — no accounts, no watermarks.
          </p>
        </header>

        {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
          const meta = CATEGORY_META[category];
          const tools = toolsByCategory(category);
          return (
            <section key={category} className="mt-12">
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ring-1 ${meta.chipClass}`}
                >
                  <meta.icon size={19} />
                </span>
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-slate-900">{meta.label}</h2>
                  <p className="text-sm text-slate-500">{meta.description}</p>
                </div>
                <span className="ml-auto rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500">
                  {tools.length} tools
                </span>
              </div>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tools.map((tool) => (
                  <ToolCard key={tool.slug} tool={tool} />
                ))}
              </div>
            </section>
          );
        })}
      </main>
      <Footer />
    </div>
  );
}
