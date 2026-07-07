/**
 * @file restore-backup.dto.ts
 * @path apps/backend/src/modules/backup/dto/restore-backup.dto.ts
 * @description DTO validasi request backup: restore-backup (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString } from "class-validator";

export class RestoreBackupDto {
  @IsOptional()
  @IsString()
  mfaCode?: string;

  @IsOptional()
  @IsString()
  confirmText?: string;
}
