import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import LoadingBar from "@/components/LoadingBar";

const poppinsSans = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "PDF Hub",
  description: "A One Stop Place For All Your PDF Work!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <script
        async
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1052528326679360"
        crossOrigin="anonymous"
      ></script>
      <body className={` ${poppinsSans.className} antialiased`}>
        <LoadingBar />
        {children}
      </body>
    </html>
  );
}

// google.com, pub - 1052528326679360, DIRECT, f08c47fec0942fa0;
{
  /* <meta name="google-adsense-account" content="ca-pub-1052528326679360"></meta> */
}

{
  /* <script
  async
  src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1052528326679360"
  crossorigin="anonymous"
></script>; */
}
