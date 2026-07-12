<div align="center">

# 📄 PDF Hub

**Your all-in-one browser-based document toolkit — no installs, no sign-up, just tools that work.**

[![Live Site](https://img.shields.io/badge/Live%20Site-pdfhub.co.in-blue?style=for-the-badge&logo=vercel)](https://pdfhub.co.in)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

</div>

---

## ✨ What is PDF Hub?

PDF Hub is a free, browser-based document utility platform. No account needed, no software to install — just upload your files and get things done. Whether you need to merge PDFs, compress images for KYC, convert spreadsheets, or extract text, PDF Hub has you covered.

---

## 🚀 Features

### 📄 PDF Tools
| Feature | Status |
|---|---|
| Merge PDFs | ✅ Available |
| Split PDFs | ✅ Available |
| Remove Pages from PDF | ✅ Available |
| Compress PDF | ✅ Available |
| PDF to Word (.docx) | ✅ Available |
| PDF to Excel (.xlsx) | ✅ Available |
| Excel to PDF | ✅ Available |
| PDF to JPG/PNG | ✅ Available |
| JPG/PNG to PDF | ✅ Available |
| Add Page Numbers | ✅ Available |
| Password Protect / Unprotect PDF | ✅ Available |
| Extract Pages | 🔜 Coming Soon |
| Organise PDF | 🔜 Coming Soon |
| Scan to PDF | 🔜 Coming Soon |

### 🖼️ Image Tools
| Feature | Status |
|---|---|
| Crop Image | ✅ Available |
| Resize Image | ✅ Available |
| Convert Image (JPG, PNG, WEBP, GIF, SVG) | ✅ Available |
| Compress Image (KYC-ready) | ✅ Available |
| Rotate & Flip | ✅ Available |
| Add Filters (Brightness, Contrast, Saturation) | ✅ Available |
| Watermark Adder | 🔜 Coming Soon |
| Background Remover | 🔜 Coming Soon |
| AI Image Upscaler | 🔜 Coming Soon |

### 📹 Video Tools *(Coming Soon)*
| Feature | Status |
|---|---|
| Video to GIF | 🔜 Coming Soon |
| Video Compressor | 🔜 Coming Soon |
| Video Trimmer / Cutter | 🔜 Coming Soon |
| Video Converter (MP4, MOV, AVI, WEBM) | 🔜 Coming Soon |
| Extract Audio from Video (MP3) | 🔜 Coming Soon |

### 📝 Text & Data Tools
| Feature | Status |
|---|---|
| PDF to Text Converter | ✅ Available |
| Word Counter & Character Counter | ✅ Available |
| JSON Formatter & Validator | ✅ Available |
| CSV to JSON Converter | ✅ Available |
| XML Formatter | ✅ Available |
| Diff Checker | ✅ Available |

### 🔄 Converter Tools
| Feature | Status |
|---|---|
| Currency Converter (live rates) | ✅ Available |
| Unit Converter | ✅ Available |
| Color Code Converter (HEX / RGB / HSL) | ✅ Available |
| Timezone Converter | ✅ Available |

---

## 🛠️ Tech Stack

- **Framework** — [Next.js 15](https://nextjs.org/) with Turbopack
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui + Radix UI
- **PDF Processing** — `pdf-lib`, `pdfjs-dist`, `pdf-parse`, `pdf2pic`
- **Document Generation** — `docx`, `html-to-docx`, `exceljs`
- **Image Processing** — `sharp`, `jimp`, `@napi-rs/canvas`
- **Drag & Drop** — `@dnd-kit/core` + `@dnd-kit/sortable`
- **Animations** — Framer Motion
- **Deployment** — Vercel

---

## 🏃 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/vanshkapadia11/Pdf-Hub.git
cd Pdf-Hub

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

---

## 📁 Project Structure

```
Pdf-Hub/
├── app/              # Next.js App Router — pages and API routes
├── components/       # Reusable UI components
├── hooks/            # Custom React hooks
├── lib/              # Utility functions and core logic
├── public/           # Static assets
└── temp/             # Temporary file processing directory
```

---

## 🌐 Live Demo

The app is live at **[pdfhub.co.in](https://pdfhub.co.in)**

---

## 🤝 Contributing

Contributions are welcome! If you'd like to add a new tool, fix a bug, or improve the UI:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m 'Add some feature'`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📜 License

This project is open source. Feel free to use, modify, and distribute it.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/vanshkapadia11">Vansh Kapadia</a>
</div>
