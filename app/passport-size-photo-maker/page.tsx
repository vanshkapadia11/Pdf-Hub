"use client";

import { useState, useRef, useEffect } from "react";
import type { ChangeEvent, DragEvent, FormEvent } from "react";
import { cn } from "@/lib/utils"; // Assuming you have this utility
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"; // Shadcn components
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Loader2Icon,
  FileIcon,
  Trash2Icon,
  Repeat2Icon,
  Image as ImageIcon,
  SettingsIcon,
} from "lucide-react";
// Assuming you have these components:
import Navbar from "@/components/Navbar";
import MoreToolsSidebar from "@/components/MoreToolsSidebar";
import Footer from "@/components/Footer";

// Shadcn Input/Select (You may need to install/import these)
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}
const Select = (props: SelectProps) => (
  <select
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    {...props}
  />
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}
const Input = (props: InputProps) => (
  <input
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
    type="number"
    min="1"
    {...props}
  />
);

// Photo Size Presets (Common examples, you can expand this)
const PHOTO_PRESETS = [
  { label: "India (35x45 mm)", width: 35, height: 45 },
  { label: "US (2x2 inches)", width: 51, height: 51 },
  { label: "Schengen (35x45 mm)", width: 35, height: 45 },
  { label: "Custom", width: 30, height: 40 }, // Default custom size
];

// Document Paper Size Presets
const PAPER_SIZES = [
  { label: "A4 (210x297 mm)", width: 210, height: 297 },
  { label: "4x6 inches (102x152 mm)", width: 102, height: 152 },
];

interface PhotoSettings {
  photoWidth: number; // mm
  photoHeight: number; // mm
  paperWidth: number; // mm
  paperHeight: number; // mm
  copies: number;
}

export default function PassportPhotoMaker() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [settings, setSettings] = useState<PhotoSettings>({
    photoWidth: PHOTO_PRESETS[0].width,
    photoHeight: PHOTO_PRESETS[0].height,
    paperWidth: PAPER_SIZES[0].width,
    paperHeight: PAPER_SIZES[0].height,
    copies: 8, // Default copies
  });

  // Clean up object URL when component unmounts or downloadUrl changes
  useEffect(() => {
    return () => {
      if (downloadUrl) URL.revokeObjectURL(downloadUrl);
    };
  }, [downloadUrl]);

  const resetState = () => {
    setFile(null);
    setLoading(false);
    setError("");
    setDownloadUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setError("");
      setDownloadUrl("");
    } else if (selectedFile) {
      setError("Only image files (JPEG, PNG, etc.) are accepted.");
      setFile(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    const droppedFile = Array.from(event.dataTransfer.files).find((f) =>
      f.type.startsWith("image/")
    );

    if (droppedFile) {
      setFile(droppedFile);
      setError("");
      setDownloadUrl("");
    } else {
      setError("Only image files are accepted.");
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
  };

  const removeFile = () => {
    setFile(null);
    setError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handlePresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = PHOTO_PRESETS.find(
      (p) => p.label === event.target.value
    );
    if (selectedPreset) {
      setSettings((prev) => ({
        ...prev,
        photoWidth: selectedPreset.width,
        photoHeight: selectedPreset.height,
      }));
    }
  };

  const handlePaperSizeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedSize = PAPER_SIZES.find(
      (s) => s.label === event.target.value
    );
    if (selectedSize) {
      setSettings((prev) => ({
        ...prev,
        paperWidth: selectedSize.width,
        paperHeight: selectedSize.height,
      }));
    }
  };

  const createPassportPhotoSheet = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    setLoading(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("photoWidth", settings.photoWidth.toString());
      formData.append("photoHeight", settings.photoHeight.toString());
      formData.append("paperWidth", settings.paperWidth.toString());
      formData.append("paperHeight", settings.paperHeight.toString());
      formData.append("copies", settings.copies.toString());

      const response = await fetch("/api/passport-photo-maker", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      setDownloadUrl(url);
    } catch (error: unknown) {
      console.error("Error creating passport photos:", error);
      if (error instanceof Error) {
        setError(
          error.message || "Failed to create passport photos. Please try again."
        );
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const isDownload = Boolean(downloadUrl);
  const isFileSelected = Boolean(file);

  return (
    <>
      <Navbar />

      {/* Full-screen Loader Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center">
            <Loader2Icon className="h-12 w-12 animate-spin text-rose-400" />
            <p className="mt-4 text-sm font-semibold uppercase text-gray-700">
              Generating Photo Sheet, please wait...
            </p>
          </div>
        </div>
      )}

      {/* Main content container */}
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
        {/* Main content area */}
        <main className="flex-1 p-4 md:p-8 flex flex-col items-center text-center">
          <div className="w-full max-w-2xl mx-auto text-left">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">
                    <span className="text-sm font-semibold uppercase cursor-pointer">
                      Home
                    </span>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold uppercase">
                    Passport Photo Maker
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            Passport Photo Maker 🪪
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Create a sheet of passport/visa photos from your image.
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* UPLOAD / SUCCESS / WORKING AREA */}
          {!isFileSelected || isDownload ? (
            <>
              {/* UPLOAD DRAG-AND-DROP AREA */}
              <div
                className={cn(
                  "w-full max-w-2xl h-48 border-2 rounded-lg flex flex-col items-center justify-center transition-colors cursor-pointer mb-20",
                  dragActive
                    ? "border-blue-500 text-blue-500 border-dashed"
                    : "border-gray-400 text-gray-500 hover:border-blue-500 hover:text-blue-500 border-dashed"
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <p className="text-sm font-semibold uppercase">
                  Click to select or drag & drop an image file here
                </p>
                <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                  JPEG or PNG format recommended.
                </p>
              </div>
              <section className="w-full max-w-2xl rounded-sm ring-2 ring-inset ring-[#e8e8e8] flex flex-col items-center">
                {/* Advertisment area */}
                {/* ... (Your ad code) ... */}
              </section>
            </>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File Info & Settings */}
              <div className="text-left space-y-4">
                <h4 className="text-lg font-semibold uppercase flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-rose-500" />
                  Selected Image
                </h4>
                <div className="flex items-center flex-wrap justify-between py-3 w-full px-4 rounded-lg bg-gray-50 border border-gray-200 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {file?.name ?? ""}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="p-1 h-auto text-red-500 hover:bg-red-50 hover:text-red-700 transition-all"
                  >
                    <Trash2Icon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <Separator />

              {/* Settings Form */}
              <div className="text-left space-y-4">
                <h4 className="text-lg font-semibold uppercase flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5 text-rose-500" />
                  Photo Sheet Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Photo Size Preset */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Photo Size Preset
                    </label>
                    <Select onChange={handlePresetChange}>
                      {PHOTO_PRESETS.map((preset) => (
                        <option key={preset.label} value={preset.label}>
                          {preset.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Number of Copies */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Number of Copies
                    </label>
                    <Input
                      value={settings.copies}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          copies: Math.max(1, parseInt(e.target.value) || 1),
                        }))
                      }
                      placeholder="e.g., 8"
                    />
                  </div>

                  {/* Custom Photo Dimensions (mm) */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Photo Width (mm)
                    </label>
                    <Input
                      value={settings.photoWidth}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          photoWidth: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        }))
                      }
                      placeholder="e.g., 35"
                      disabled={
                        settings.photoWidth !==
                        PHOTO_PRESETS.find((p) => p.label === "Custom")?.width
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Photo Height (mm)
                    </label>
                    <Input
                      value={settings.photoHeight}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          photoHeight: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        }))
                      }
                      placeholder="e.g., 45"
                      disabled={
                        settings.photoHeight !==
                        PHOTO_PRESETS.find((p) => p.label === "Custom")?.height
                      }
                    />
                  </div>

                  {/* Paper Size */}
                  <div className="space-y-1 col-span-1 md:col-span-2">
                    <label className="text-sm font-medium leading-none">
                      Output Paper Size
                    </label>
                    <Select onChange={handlePaperSizeChange}>
                      {PAPER_SIZES.map((size) => (
                        <option key={size.label} value={size.label}>
                          {size.label} - ({size.width}x{size.height} mm)
                        </option>
                      ))}
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Generate Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={createPassportPhotoSheet}
                  disabled={!file || loading}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Passport Photos"
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="w-full max-w-2xl mt-8 p-4 rounded-lg bg-red-50 border border-red-300 text-red-600 text-sm font-semibold uppercase text-left">
              <p>{error}</p>
            </div>
          )}

          {/* Download Link */}
          {downloadUrl && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200 text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Photo Sheet Created Successfully!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600">
                Your high-resolution photo sheet is ready for download.
              </p>
              <div className="flex justify-center mt-4 md:space-x-4 gap-4 flex-wrap">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download={`passport-photos-${settings.photoWidth}x${settings.photoHeight}mm.png`}
                    className="text-sm font-semibold uppercase"
                  >
                    Download Photo Sheet
                  </a>
                </Button>
                <Button
                  onClick={resetState}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-gray-400 text-sm font-semibold uppercase"
                >
                  <Repeat2Icon className="mr-2 h-4 w-4" />
                  Start New
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/passport-photo-maker"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}

// NOTE: You need to define your utility function 'cn' and components (Navbar, MoreToolsSidebar, Footer) for this to work.
