import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import Topbar from "@/components/layout/Topbar";

import Footer from "@/components/layout/Footer";
import { SynerixUIProvider } from "@/components/providers/SynerixUIProvider";

export const metadata: Metadata = {
  title: {
    default: "Synerix FTTH - Network Operations Platform",
    template: "%s | Synerix FTTH",
  },
  description: "Enterprise FTTH Operations, Field Engineering & Network Management Platform by Synerix",
  icons: {
    icon: [
      { url: "/images/icon-synerix.png", type: "image/png" },
      { url: "/icon.png", sizes: "48x48", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    shortcut: "/images/icon-synerix.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-synerix-bg text-synerix-text antialiased">
        <SynerixUIProvider>
          <Topbar />
          <main className="flex-1 w-full flex flex-col">
            {children}
          </main>
          <Footer />
        </SynerixUIProvider>
      </body>
    </html>
  );
}