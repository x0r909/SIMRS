import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Res,
  Request
} from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import { JwtAuthGuard } from '../../common/auth/jwt-auth.guard';
import { BackupService } from './backup.service';
import { CreateBackupDto, RestoreBackupDto } from './dto';

@Controller('backup')
@UseGuards(JwtAuthGuard)
export class BackupController {
  constructor(private readonly backup: BackupService) {}

  @Post('create')
  async createBackup(@Body() dto: CreateBackupDto, @Request() req: any) {
    const actorId = req.user?.sub || req.user?.id;
    return this.backup.createBackup(actorId, dto.description);
  }

  @Post('restore')
  async restoreBackup(@Body() dto: RestoreBackupDto, @Request() req: any) {
    const actorId = req.user?.sub || req.user?.id;
    return this.backup.restoreBackup(actorId, dto.backupId);
  }

  @Get()
  async listBackups(@Query('page') page = 1, @Query('limit') limit = 20) {
    const result = await this.backup.listBackups(parseInt(page as any), parseInt(limit as any));
    return { success: true, data: result.data, meta: result.meta };
  }

  @Get(':id')
  async getBackup(@Param('id') id: string) {
    return this.backup.getBackup(id);
  }

  @Get(':id/download')
  async downloadBackup(@Param('id') id: string, @Res() res: Response) {
    const backup = await this.backup.downloadBackup(id);

    res.setHeader('Content-Disposition', `attachment; filename="${backup.filename}"`);
    res.setHeader('Content-Type', 'application/sql');

    const stream = fs.createReadStream(backup.path);
    stream.pipe(res);
  }

  @Delete(':id')
  async deleteBackup(@Param('id') id: string, @Request() req: any) {
    const actorId = req.user?.sub || req.user?.id;
    return this.backup.deleteBackup(actorId, id);
  }
}
