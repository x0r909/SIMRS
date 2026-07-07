/**
 * @file auth-validation.dto.ts
 * @path apps/backend/src/modules/auth/dto/auth-validation.dto.ts
 * @description DTO validasi request auth: auth-validation (class-validator).
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

/**
 * Authentication DTOs with validation
 */

import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @IsEmail({}, { message: 'Email harus valid' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}

export class RegisterDto {
  @IsEmail({}, { message: 'Email harus valid' })
  @Transform(({ value }) => value?.toLowerCase().trim())
  email!: string;

  @IsString()
  @MinLength(8, { message: 'Nama harus minimal 8 karakter' })
  @MaxLength(100)
  @Transform(({ value }) => value?.trim())
  name!: string;

  @IsString()
  @MinLength(8, { message: 'Password harus minimal 8 karakter' })
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'Password harus mengandung huruf besar' })
  @Matches(/[a-z]/, { message: 'Password harus mengandung huruf kecil' })
  @Matches(/[0-9]/, { message: 'Password harus mengandung angka' })
  @Matches(/[!@#$%^&*]/, { message: 'Password harus mengandung karakter spesial' })
  password!: string;
}

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  oldPassword!: string;

  @IsString()
  @MinLength(8, { message: 'Password baru harus minimal 8 karakter' })
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'Password harus mengandung huruf besar' })
  @Matches(/[a-z]/, { message: 'Password harus mengandung huruf kecil' })
  @Matches(/[0-9]/, { message: 'Password harus mengandung angka' })
  @Matches(/[!@#$%^&*]/, { message: 'Password harus mengandung karakter spesial' })
  newPassword!: string;

  @IsString()
  @MinLength(1)
  confirmPassword!: string;
}

export class RefreshTokenDto {
  @IsString()
  refreshToken!: string;
}

export class PasswordResetDto {
  @IsEmail({}, { message: 'Email harus valid' })
  email!: string;

  @IsString()
  @MinLength(1)
  resetToken!: string;

  @IsString()
  @MinLength(8, { message: 'Password baru harus minimal 8 karakter' })
  @MaxLength(128)
  @Matches(/[A-Z]/, { message: 'Password harus mengandung huruf besar' })
  @Matches(/[a-z]/, { message: 'Password harus mengandung huruf kecil' })
  @Matches(/[0-9]/, { message: 'Password harus mengandung angka' })
  @Matches(/[!@#$%^&*]/, { message: 'Password harus mengandung karakter spesial' })
  newPassword!: string;
}
