import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ subsets: ["latin"], variable: '--font-sans' });

export const metadata: Metadata = {
  title: "Artcelerator | Content & Agency OS",
  description: "Sistem operasi komprehensif untuk Creative Agency. Kelola konten, klien, proyek, dan keuangan dalam satu tempat.",
  openGraph: {
    title: "Artcelerator | Content & Agency OS",
    description: "Sistem operasi komprehensif untuk Creative Agency.",
    url: "https://artcelerator.vercel.app",
    siteName: "Artcelerator",
    locale: "id_ID",
    type: "website",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={cn("font-sans", inter.variable)}>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0" rel="stylesheet"/>
      </head>
      <body className={inter.className}>
        <Providers>
          <TooltipProvider>
            {children}
            <Toaster position="top-right" richColors />
          </TooltipProvider>
        </Providers>
      </body>
    </html>
  );
}
