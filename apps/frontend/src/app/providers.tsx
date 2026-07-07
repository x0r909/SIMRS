"use client";


/**
 * @file providers.tsx
 * @path apps/frontend/src/app/providers.tsx
 * @description Provider global React: QueryClient, theme, toast.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "next-themes";
import { useState } from "react";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  const isDevelopment = process.env.NODE_ENV === "development";

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={client}>
        {children}
        <Toaster richColors />
        {isDevelopment ? <ReactQueryDevtools initialIsOpen={false} /> : null}
      </QueryClientProvider>
    </ThemeProvider>
  );
}

