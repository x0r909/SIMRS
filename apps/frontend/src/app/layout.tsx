/**
 * @file layout.tsx
 * @path apps/frontend/src/app/layout.tsx
 * @description Layout route /layout.tsx: shell navigasi dan auth guard client.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import type { Metadata } from "next";
import { Manrope } from "next/font/google";

import "./globals.css";
import { Providers } from "./providers";

const manrope = Manrope({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "SIMRS v2",
  description: "Sistem Informasi Manajemen Rumah Sakit",
  manifest: "/manifest.webmanifest",
  themeColor: "#0f766e"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${manrope.className} min-h-screen antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

