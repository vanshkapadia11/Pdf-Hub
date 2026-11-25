import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Home } from "lucide-react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MoreToolsSidebar from "./MoreToolsSidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { CATEGORY_META, getTool } from "@/lib/tools";

interface ToolShellProps {
  /** Tool href (e.g. "/merge-pdf") used for breadcrumbs and the sidebar. */
  toolHref: string;
  title: string;
  description: string;
  icon: LucideIcon;
  children: React.ReactNode;
}

/**
 * Shared page chrome for every tool: navbar, breadcrumb, header, main
 * column + "more tools" rail, and footer.
 */
export default function ToolShell({ toolHref, title, description, icon: Icon, children }: ToolShellProps) {
  const tool = getTool(toolHref);
  const category = tool ? CATEGORY_META[tool.category] : undefined;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="container-page flex-1 py-8 lg:py-12">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href="/" className="flex items-center gap-1">
                  <Home size={13} />
                  Home
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {category && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink asChild>
                    <Link href="/more">{category.label}</Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </>
            )}
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <header className="mt-6 flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-gradient text-white shadow-md shadow-indigo-200">
            <Icon size={26} strokeWidth={2} />
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-slate-500 sm:text-base">
              {description}
            </p>
          </div>
        </header>

        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="min-w-0 space-y-6">{children}</div>
          <aside className="hidden lg:block">
            <div className="sticky top-24">
              <MoreToolsSidebar currentHref={toolHref} />
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </div>
  );
}
