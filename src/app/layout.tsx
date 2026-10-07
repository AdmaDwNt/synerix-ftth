import type { Metadata } from "next";
import Image from "next/image";
import "./globals.css";
import Topbar from "@/components/layout/Topbar";

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
        <Topbar />
        <main className="flex-1 w-full flex flex-col">
          {children}
        </main>
        <footer className="border-t border-synerix-border bg-white/80 backdrop-blur-xs py-4 mb-16 lg:mb-0 text-xs text-synerix-subtext">
          <div className="w-full px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div>
              <p className="font-semibold text-slate-700">FTTH Operations & Field Engineering Platform</p>
              <p className="text-[11px] text-slate-400">Integrated Network Management System</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">Developed & Powered by</span>
              <div className="flex items-center px-2.5 py-1 rounded-lg bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xs">
                <Image
                  src="/images/logo-synerix.png"
                  alt="Synerix Technology Solution"
                  width={95}
                  height={22}
                  className="h-4.5 w-auto object-contain brightness-105"
                />
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}