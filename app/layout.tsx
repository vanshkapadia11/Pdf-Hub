import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import LoadingBar from "@/components/site/LoadingBar";

const poppinsSans = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "PDF Hub — Free Online PDF & Image Tools",
    template: "%s | PDF Hub",
  },
  description:
    "Merge, split, compress and convert PDFs, plus a full image toolkit — fast, free and privacy-friendly. No sign-up, no watermarks.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "split PDF",
    "compress PDF",
    "PDF to Word",
    "PDF to Excel",
    "image compressor",
    "KYC image compressor",
    "passport photo maker",
  ],
  openGraph: {
    title: "PDF Hub — Free Online PDF & Image Tools",
    description:
      "Every document tool you need in one place. Free, fast and private.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppinsSans.variable} font-sans antialiased`}>
        {/* Google AdSense (kept from the original deployment configuration). */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1052528326679360"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        <LoadingBar />
        {children}
      </body>
    </html>
  );
}
