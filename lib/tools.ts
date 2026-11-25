import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  Combine,
  Crop,
  FileSpreadsheet,
  FileText,
  FileType2,
  Image as ImageIcon,
  Layers,
  MoveVertical,
  Scaling,
  Scissors,
  Shuffle,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Trash2,
  Type,
  Images,
  IdCard,
} from "lucide-react";

export type ToolCategory = "pdf" | "image" | "convert";

export interface Tool {
  slug: string;
  name: string;
  shortName?: string;
  description: string;
  href: string;
  icon: LucideIcon;
  category: ToolCategory;
  popular?: boolean;
}

export const CATEGORY_META: Record<
  ToolCategory,
  { label: string; description: string; icon: LucideIcon; chipClass: string }
> = {
  pdf: {
    label: "PDF Tools",
    description: "Merge, split, organize and optimize PDF documents",
    icon: FileText,
    chipClass: "bg-rose-50 text-rose-600 ring-rose-100",
  },
  image: {
    label: "Image Tools",
    description: "Edit, compress and convert images right in your browser",
    icon: ImageIcon,
    chipClass: "bg-violet-50 text-violet-600 ring-violet-100",
  },
  convert: {
    label: "Converters",
    description: "Move documents between PDF, Word, Excel and images",
    icon: ArrowLeftRight,
    chipClass: "bg-amber-50 text-amber-600 ring-amber-100",
  },
};

/**
 * Single source of truth for every tool in the app. The navbar, landing
 * page, tools directory and sidebar all render from this list, so a new
 * tool only needs to be added once.
 */
export const TOOLS: Tool[] = [
  // --- PDF tools ---
  {
    slug: "merge-pdf",
    name: "Merge PDF",
    description: "Combine multiple PDF files into one document, in any order.",
    href: "/merge-pdf",
    icon: Combine,
    category: "pdf",
    popular: true,
  },
  {
    slug: "split-pdf",
    name: "Split PDF",
    description: "Split a PDF into separate documents by page ranges.",
    href: "/split-pdf",
    icon: Scissors,
    category: "pdf",
    popular: true,
  },
  {
    slug: "organize-pdf",
    name: "Organize PDF",
    description: "Reorder, rotate preview and delete pages with a visual page grid.",
    href: "/organize-pdf",
    icon: Shuffle,
    category: "pdf",
  },
  {
    slug: "remove-pdf-pages",
    name: "Remove PDF Pages",
    description: "Delete unwanted pages from a PDF in seconds.",
    href: "/remove-pdf-pages",
    icon: Trash2,
    category: "pdf",
  },
  {
    slug: "extract-pdf-pages",
    name: "Extract PDF Pages",
    description: "Pull selected pages out of a PDF into a new document.",
    href: "/extract-pdf-pages",
    icon: Layers,
    category: "pdf",
  },
  {
    slug: "compress-pdf",
    name: "Compress PDF",
    description: "Shrink PDF file size with preset or target-size compression.",
    href: "/compress-pdf",
    icon: Scaling,
    category: "pdf",
    popular: true,
  },
  {
    slug: "add-number-to-pages",
    name: "Add Page Numbers",
    description: "Stamp page numbers onto a PDF with position and format control.",
    href: "/add-number-to-pages",
    icon: Stamp,
    category: "pdf",
  },
  {
    slug: "edit-pdf",
    name: "Edit PDF",
    description: "Add text to any page of a PDF — position, size and color.",
    href: "/edit-pdf",
    icon: Type,
    category: "pdf",
  },

  // --- Converters ---
  {
    slug: "pdf-word",
    name: "PDF to Word",
    description: "Convert a text-based PDF into an editable Word (.docx) file.",
    href: "/pdf-word",
    icon: FileType2,
    category: "convert",
    popular: true,
  },
  {
    slug: "pdf-to-excel",
    name: "PDF to Excel",
    description: "Extract tables and text from a PDF into an Excel (.xlsx) sheet.",
    href: "/pdf-to-excel",
    icon: FileSpreadsheet,
    category: "convert",
  },
  {
    slug: "excel-to-pdf",
    name: "Excel to PDF",
    description: "Turn Excel spreadsheets into clean, printable PDF tables.",
    href: "/excel-to-pdf",
    icon: FileSpreadsheet,
    category: "convert",
  },
  {
    slug: "pdf-to-images",
    name: "PDF to Images",
    description: "Export every PDF page as a JPG, PNG or WebP image.",
    href: "/pdf-to-images",
    icon: ImageIcon,
    category: "convert",
  },
  {
    slug: "images-to-pdf",
    name: "Images to PDF",
    description: "Combine JPG, PNG and WebP images into a single PDF.",
    href: "/images-to-pdf",
    icon: Images,
    category: "convert",
    popular: true,
  },

  // --- Image tools ---
  {
    slug: "compress-image",
    name: "Compress Image",
    description: "Reduce image file size by quality or target file size.",
    href: "/compress-image",
    icon: Scaling,
    category: "image",
  },
  {
    slug: "resize-image",
    name: "Resize Image",
    description: "Resize images by pixels or percentage with aspect-ratio lock.",
    href: "/resize-image",
    icon: MoveVertical,
    category: "image",
  },
  {
    slug: "crop-image",
    name: "Crop Image",
    description: "Crop images to exact pixel coordinates and dimensions.",
    href: "/crop-image",
    icon: Crop,
    category: "image",
  },
  {
    slug: "rotate-image",
    name: "Rotate & Flip Image",
    description: "Rotate images by 90° steps or mirror them horizontally and vertically.",
    href: "/rotate-image",
    icon: Shuffle,
    category: "image",
  },
  {
    slug: "convert-image",
    name: "Convert Image",
    description: "Convert between JPG, PNG and WebP formats instantly.",
    href: "/convert-image",
    icon: ArrowLeftRight,
    category: "image",
  },
  {
    slug: "add-filters",
    name: "Image Filters",
    description: "Adjust brightness, contrast and saturation with a live preview.",
    href: "/add-filters",
    icon: SlidersHorizontal,
    category: "image",
  },
  {
    slug: "kyc-image-compressor",
    name: "KYC Image Compressor",
    description: "Compress documents to exact KB limits for KYC and bank uploads.",
    href: "/kyc-image-compressor",
    icon: Sparkles,
    category: "image",
    popular: true,
  },
  {
    slug: "passport-size-photo-maker",
    name: "Passport Photo Maker",
    description: "Create printable photo sheets in standard passport sizes.",
    href: "/passport-size-photo-maker",
    icon: IdCard,
    category: "image",
  },
];

export const POPULAR_TOOLS = TOOLS.filter((tool) => tool.popular);

export function toolsByCategory(category: ToolCategory): Tool[] {
  return TOOLS.filter((tool) => tool.category === category);
}

export function getTool(href: string): Tool | undefined {
  return TOOLS.find((tool) => tool.href === href);
}
