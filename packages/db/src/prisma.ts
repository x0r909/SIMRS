/**
 * @file prisma.ts
 * @path packages/db/src/prisma.ts
 * @description Ekspor klien Prisma dan helper package @simrs/db.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __simrsPrisma: PrismaClient | undefined;
}

export const prisma =
  globalThis.__simrsPrisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["warn", "error"]
  });

if (process.env.NODE_ENV !== "production") globalThis.__simrsPrisma = prisma;

