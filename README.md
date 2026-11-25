<div align="center">

# 📄 PDF Hub

**Your all-in-one browser-based document toolkit — no installs, no sign-up, just tools that work.**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ✨ What is PDF Hub?

PDF Hub is a free, browser-based document utility platform. No account needed, no
software to install — just upload your files and get things done. Every tool is
implemented server-side with real, working code: pages are merged, split,
compressed and converted by the actual pipeline, not placeholders.

---

## 🚀 Features

All 21 tools below are implemented and verified end-to-end.

### 📄 PDF Tools
| Tool | What it does |
|---|---|
| Merge PDF | Combine PDFs in any order (drag to arrange) |
| Split PDF | Split by page ranges into a ZIP of PDFs |
| Organize PDF | Visual page grid — reorder, delete, live thumbnails |
| Remove PDF Pages | Delete unwanted pages |
| Extract PDF Pages | Pull selected pages into a new PDF |
| Compress PDF | Presets, custom quality or exact target size (real rasterization-based compression) |
| Add Page Numbers | Position, start page/number, "3 of 12" format, black/white text |
| Edit PDF | Add text to any page — position, size, color (100% client-side) |

### 🔄 Converters
| Tool | What it does |
|---|---|
| PDF to Word | Real text extraction → editable .docx with paragraphs & page breaks |
| PDF to Excel | Layout-aware table extraction → .xlsx with detected columns |
| Excel to PDF | Printable PDF tables — bold headers, gridlines, wrapping, landscape for wide sheets |
| PDF to Images | Every page as JPG/PNG/WebP at up to 300 DPI (ZIP) |
| Images to PDF | JPG/PNG/WebP/GIF/TIFF → PDF with auto page orientation |

### 🖼️ Image Tools
| Tool | What it does |
|---|---|
| Compress Image | By quality or exact target KB (binary search) |
| Resize Image | Pixels or percentage, aspect-ratio lock |
| Crop Image | Exact pixel crop with live preview overlay |
| Rotate & Flip | 90° steps + flips with live preview (flips mapped correctly) |
| Convert Image | JPG / PNG / WebP, transparency flattened to white for JPG |
| Image Filters | Brightness / contrast / saturation with live preview |
| KYC Image Compressor | Exact 50/100/200/500 KB or custom limits for KYC portals |
| Passport Photo Maker | 35×45mm, 2×2", custom sizes → printable 300 DPI sheet with cut guides |

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org/) (App Router) with Turbopack
- **Language** — TypeScript + JavaScript route handlers
- **Styling** — Tailwind CSS v4 + shadcn/ui + Radix UI, Poppins
- **PDF processing** — `pdf-lib` (page manipulation), `pdfjs-dist` + `@napi-rs/canvas` (rasterization & text extraction server-side; thumbnails in the browser)
- **Documents** — `docx` (Word), `exceljs` (Excel), `xlsx` (reading)
- **Images** — `sharp` (compression, resizing, formats), `jszip` (archives)
- **Drag & drop** — `@dnd-kit/core` + `@dnd-kit/sortable`
- **Deployment** — Vercel (AdSense-ready)

### Architecture notes

- `lib/tools.ts` is the single source of truth for the tool list — the navbar,
  landing page, tools directory and sidebar all render from it, so links can
  never go stale.
- `lib/server/` holds the shared server helpers (`http.ts` validation/error
  envelope, `pdf.js` rasterization & text extraction, `image.js` sharp helpers).
- Every tool page = a server component (metadata + shell) + a colocated client
  component (state machine via `hooks/use-tool-job.ts` — consistent loading,
  error and result handling with automatic object-URL cleanup).
- All API routes return JSON `{ error }` on failures with proper 400s for
  user-input problems, and `Content-Disposition` filenames on success.

---

## 🏃 Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
npm run dev        # development server at http://localhost:3000
```

### Production

```bash
npm run build
npm start
```

### Lint

```bash
npm run lint
```

---

## 📁 Project Structure

```
├── app/                  # Next.js App Router — pages + API routes
│   ├── api/<tool>/       # One route handler per tool
│   └── <tool>/           # page.tsx (server) + <tool>-tool.tsx (client)
├── components/
│   ├── site/             # App chrome: Navbar, Footer, ToolShell, Dropzone…
│   └── ui/               # shadcn/ui primitives
├── lib/
│   ├── tools.ts          # Tool registry (single source of truth)
│   ├── client/api.ts     # Fetch wrapper + formatting helpers
│   └── server/           # Server-side PDF/image processing helpers
├── hooks/                # useToolJob state machine, use-mobile
└── public/               # Static assets (incl. pdf.js worker)
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-feature`)
3. Add your tool to `lib/tools.ts`, `app/api/<tool>/route.js` and `app/<tool>/`
4. Commit and open a Pull Request

---

## 📜 License

This project is open source. Feel free to use, modify, and distribute it.
