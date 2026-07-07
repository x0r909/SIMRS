/**
 * @file captcha.controller.ts
 * @path apps/backend/src/modules/captcha/captcha.controller.ts
 * @description Controller REST API captcha: endpoint HTTP. CAPTCHA native untuk proteksi form publik.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CaptchaService } from './captcha.service';

@ApiTags('captcha')
@Controller('captcha')
export class CaptchaController {
  constructor(private readonly captchaService: CaptchaService) {}

  @Get('generate')
  @ApiOperation({ summary: 'Generate a new captcha' })
  @ApiResponse({
    status: 200,
    description: 'Captcha generated successfully',
    schema: {
      example: {
        captchaId: 'abc123...',
        image: 'data:image/svg+xml;base64,...',
        question: '25 + 17'
      }
    }
  })
  generateCaptcha() {
    return this.captchaService.generateCaptcha();
  }
}
