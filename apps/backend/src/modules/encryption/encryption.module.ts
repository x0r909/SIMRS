/**
 * @file encryption.module.ts
 * @path apps/backend/src/modules/encryption/encryption.module.ts
 * @description Modul NestJS encryption: wiring dependency injection. Layanan enkripsi/dekripsi field sensitif (AES, blind index).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Global, Module } from "@nestjs/common";

import { EncryptionService } from "./encryption.service";

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService]
})
export class EncryptionModule {}
