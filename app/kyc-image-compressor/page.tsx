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
  ImageIcon,
  SettingsIcon,
  Maximize2Icon,
  MoveRightIcon,
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

// Common target sizes in KB
const TARGET_SIZE_PRESETS = [
  { label: "50 KB (Signature/Photo)", sizeKB: 50 },
  { label: "100 KB (KYC Documents)", sizeKB: 100 },
  { label: "200 KB (General Docs)", sizeKB: 200 },
  { label: "Custom KB", sizeKB: 100 },
];

interface CompressorSettings {
  targetSizeKB: number;
  outputFormat: "jpeg" | "png" | "webp";
}

export default function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [downloadUrl, setDownloadUrl] = useState<string>("");
  const [newSize, setNewSize] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState<CompressorSettings>({
    targetSizeKB: TARGET_SIZE_PRESETS[1].sizeKB, // Default to 100 KB
    outputFormat: "jpeg",
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
    setNewSize(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Helper to convert Bytes to KB
  const bytesToKB = (bytes: number): string => (bytes / 1024).toFixed(1);

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      setFile(selectedFile);
      setError("");
      setDownloadUrl("");
      setNewSize(null);
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
      setNewSize(null);
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

  const handleTargetPresetChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const selectedPreset = TARGET_SIZE_PRESETS.find(
      (p) => p.label === event.target.value
    );
    if (selectedPreset) {
      setSettings((prev) => ({
        ...prev,
        targetSizeKB: selectedPreset.sizeKB,
      }));
    }
  };

  const compressImage = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select an image file.");
      return;
    }

    // Check if compression is even necessary
    if (file.size / 1024 <= settings.targetSizeKB) {
      setError(
        `File is already below ${settings.targetSizeKB} KB. No compression needed.`
      );
      return;
    }

    setLoading(true);
    setError("");
    setDownloadUrl("");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("targetSizeKB", settings.targetSizeKB.toString());
      formData.append("outputFormat", settings.outputFormat);

      // Original size is also sent for logging/context
      formData.append("originalSizeKB", bytesToKB(file.size));

      const response = await fetch("/api/kyc-compressor", {
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
      setNewSize(blob.size); // Record the size of the compressed blob
    } catch (error: unknown) {
      console.error("Error compressing image:", error);
      if (error instanceof Error) {
        setError(
          error.message || "Failed to compress image. Please try again."
        );
      } else {
        setError("An unknown error occurred during compression.");
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
              Optimizing image size, please wait...
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
                    KYC Image Compressor
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <h1 className="text-4xl font-extrabold uppercase mt-6">
            KYC Image Size Optimizer ⚖️
          </h1>
          <p className="text-xs font-semibold uppercase mt-2 mb-8 text-zinc-600">
            Compress Aadhar/PAN photos and signatures to strict file size limits
            (e.g., 50 KB, 100 KB).
          </p>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/jpeg,image/png"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* UPLOAD / SUCCESS / WORKING AREA */}
          {!isFileSelected || isDownload ? (
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
                Click to select or drag & drop an image file (JPEG/PNG)
              </p>
              <p className="text-xs font-semibold uppercase mt-2 text-zinc-600">
                Max file size 10MB. We prioritize meeting the target size.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-xl bg-white shadow-lg border border-gray-200 space-y-6">
              {/* File Info & Settings */}
              <div className="text-left space-y-4">
                <h4 className="text-lg font-semibold uppercase flex items-center gap-2">
                  <ImageIcon className="h-5 w-5 text-rose-500" />
                  Selected Image Details
                </h4>
                <div className="flex items-center flex-wrap justify-between py-3 w-full px-4 rounded-lg bg-gray-50 border border-gray-200 transition-colors duration-200">
                  <div className="flex items-center space-x-3">
                    <FileIcon className="h-5 w-5 text-gray-400" />
                    <span className="text-sm text-gray-700 font-medium">
                      {file?.name ?? ""} ({bytesToKB(file?.size ?? 0)} KB)
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
                  Compression Targets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Target Size Preset */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Target Size Preset (KB)
                    </label>
                    <Select onChange={handleTargetPresetChange}>
                      {TARGET_SIZE_PRESETS.map((preset) => (
                        <option key={preset.label} value={preset.label}>
                          {preset.label}
                        </option>
                      ))}
                    </Select>
                  </div>

                  {/* Custom Target Size */}
                  <div className="space-y-1">
                    <label className="text-sm font-medium leading-none">
                      Custom Target Size (KB)
                    </label>
                    <Input
                      value={settings.targetSizeKB}
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          targetSizeKB: Math.max(
                            1,
                            parseInt(e.target.value) || 1
                          ),
                        }))
                      }
                      placeholder="e.g., 50"
                      disabled={
                        settings.targetSizeKB !==
                        TARGET_SIZE_PRESETS.find((p) => p.label === "Custom KB")
                          ?.sizeKB
                      }
                    />
                  </div>

                  {/* Output Format */}
                  <div className="space-y-1 col-span-1">
                    <label className="text-sm font-medium leading-none">
                      Output Format
                    </label>
                    <Select
                      onChange={(e) =>
                        setSettings((prev) => ({
                          ...prev,
                          outputFormat: e.target.value as
                            | "jpeg"
                            | "png"
                            | "webp",
                        }))
                      }
                    >
                      <option value="jpeg">JPEG (Best for compression)</option>
                      <option value="png">
                        PNG (Lossless, less compression)
                      </option>
                    </Select>
                  </div>
                </div>
              </div>
              <Separator />

              {/* Compress Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={compressImage}
                  disabled={!file || loading || settings.targetSizeKB < 1}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-rose-400 text-sm font-semibold uppercase"
                >
                  {loading ? (
                    <>
                      <Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
                      Compressing...
                    </>
                  ) : (
                    <>
                      <Maximize2Icon className="mr-2 h-4 w-4 rotate-180" />
                      Optimize to {settings.targetSizeKB} KB
                    </>
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
          {downloadUrl && newSize !== null && (
            <div className="w-full max-w-2xl mt-8 p-6 rounded-lg bg-white shadow-lg border border-green-200 text-center">
              <h3 className="text-lg font-semibold uppercase mb-4 text-green-700">
                Image Optimized Successfully!
              </h3>
              <p className="text-sm font-semibold uppercase text-zinc-600 flex items-center justify-center gap-2">
                Original Size:{" "}
                <span className="text-rose-500">
                  {bytesToKB(file?.size ?? 0)} KB
                </span>
                <MoveRightIcon className="text-green-600" />
                New Size:{" "}
                <span className="text-amber-400">{bytesToKB(newSize)} KB</span>
              </p>
              <div className="flex justify-center mt-4 md:space-x-4 gap-4 flex-wrap">
                <Button
                  variant={"outline"}
                  className="ring-2 ring-inset ring-green-500"
                >
                  <a
                    href={downloadUrl}
                    download={`optimized-${settings.targetSizeKB}kb.${settings.outputFormat}`}
                    className="text-sm font-semibold uppercase"
                  >
                    Download Optimized {settings.outputFormat.toUpperCase()}
                  </a>
                </Button>
                <Button
                  onClick={resetState}
                  variant={"outline"}
                  className="ring-2 ring-inset ring-gray-400 text-sm font-semibold uppercase"
                >
                  <Repeat2Icon className="mr-2 h-4 w-4" />
                  Optimize another file
                </Button>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar Container */}
        <aside className="md:w-[25%] p-4 bg-gray-100 border-l border-gray-200">
          <MoreToolsSidebar currentPage={"/image-compressor"} />
        </aside>
      </div>
      <Footer />
    </>
  );
}
