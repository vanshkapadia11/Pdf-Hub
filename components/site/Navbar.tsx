"use client";

import { FileText, LayoutGrid, Menu } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CATEGORY_META, TOOLS, toolsByCategory } from "@/lib/tools";

const Navbar = () => {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5" aria-label="PDF Hub home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-white shadow-sm">
            <FileText size={18} strokeWidth={2.2} />
          </span>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            PDF&nbsp;Hub
          </span>
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          <Link
            href="/"
            className={cn(
              "rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors",
              isActive("/") ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            Home
          </Link>
          {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
            const meta = CATEGORY_META[category];
            const categoryActive = toolsByCategory(category).some((tool) => isActive(tool.href));
            const CategoryIcon = meta.icon;
            return (
              <DropdownMenu key={category}>
                <DropdownMenuTrigger
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold outline-none transition-colors data-[state=open]:bg-indigo-50 data-[state=open]:text-indigo-700",
                    categoryActive ? "bg-indigo-50 text-indigo-700" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  )}
                >
                  <CategoryIcon size={15} className="hidden lg:block" />
                  {meta.label}
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-60">
                  <DropdownMenuLabel className="text-xs font-medium text-slate-500">
                    {meta.label}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {toolsByCategory(category).map((tool) => (
                    <DropdownMenuItem key={tool.slug} asChild>
                      <Link href={tool.href} className="cursor-pointer">
                        <tool.icon size={15} className="text-slate-400" />
                        <span>{tool.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:block">
          <Button asChild className="bg-brand-gradient font-semibold text-white shadow-sm transition-transform hover:-translate-y-0.5">
            <Link href="/more">
              <LayoutGrid size={16} className="mr-1" />
              All Tools
            </Link>
          </Button>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Open menu" className="md:hidden">
              <Menu size={20} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 overflow-y-auto p-6">
            <SheetTitle className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-white">
                <FileText size={16} strokeWidth={2.2} />
              </span>
              <span className="font-bold text-slate-900">PDF Hub</span>
            </SheetTitle>
            <nav className="mt-6 space-y-5" aria-label="Mobile">
              <Link
                href="/"
                className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
              >
                Home
              </Link>
              {(Object.keys(CATEGORY_META) as (keyof typeof CATEGORY_META)[]).map((category) => {
                const meta = CATEGORY_META[category];
                return (
                  <div key={category}>
                    <p className="px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      {meta.label}
                    </p>
                    <div className="mt-1.5 space-y-0.5">
                      {toolsByCategory(category).map((tool) => (
                        <Link
                          key={tool.slug}
                          href={tool.href}
                          className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-indigo-50 hover:text-indigo-700"
                        >
                          <tool.icon size={15} className="text-slate-400" />
                          {tool.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
              <Link
                href="/more"
                className="flex items-center justify-center gap-2 rounded-xl bg-brand-gradient px-3 py-2.5 text-sm font-semibold text-white"
              >
                <LayoutGrid size={15} />
                Browse all {TOOLS.length} tools
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
};

export default Navbar;
