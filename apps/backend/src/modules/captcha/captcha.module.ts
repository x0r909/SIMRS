/**
 * @file captcha.module.ts
 * @path apps/backend/src/modules/captcha/captcha.module.ts
 * @description Modul NestJS captcha: wiring dependency injection. CAPTCHA native untuk proteksi form publik.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Module } from '@nestjs/common';
import { CaptchaService } from './captcha.service';
import { CaptchaController } from './captcha.controller';

@Module({
  controllers: [CaptchaController],
  providers: [CaptchaService],
  exports: [CaptchaService]
})
export class CaptchaModule {}
