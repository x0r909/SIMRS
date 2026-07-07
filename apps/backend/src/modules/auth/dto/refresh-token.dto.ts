/**
 * @file refresh-token.dto.ts
 * @path apps/backend/src/modules/auth/dto/refresh-token.dto.ts
 * @description DTO validasi request auth: refresh-token (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { IsString, MinLength } from "class-validator";

export class RefreshTokenDto {
  @IsString()
  @MinLength(10)
  refreshToken!: string;
}
