/**
 * @file storage.module.ts
 * @path apps/backend/src/shared/storage/storage.module.ts
 * @description Integrasi MinIO object storage.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { MinioService } from "./minio.service";

@Global()
@Module({
  providers: [MinioService],
  exports: [MinioService]
})
export class StorageModule {}

