/**
 * @file prisma.module.ts
 * @path apps/backend/src/shared/prisma/prisma.module.ts
 * @description Koneksi Prisma ORM ke PostgreSQL.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { PrismaService } from "./prisma.service";

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService]
})
export class PrismaModule {}

