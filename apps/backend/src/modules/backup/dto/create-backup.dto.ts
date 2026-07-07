/**
 * @file create-backup.dto.ts
 * @path apps/backend/src/modules/backup/dto/create-backup.dto.ts
 * @description DTO validasi request backup: create-backup (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateBackupDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  description?: string;
}
