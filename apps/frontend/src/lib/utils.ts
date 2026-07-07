/**
 * @file utils.ts
 * @path apps/frontend/src/lib/utils.ts
 * @description Utilitas umum: cn() untuk merge class Tailwind.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

