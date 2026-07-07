/**
 * @file doctors.controller.ts
 * @path apps/backend/src/modules/doctors/doctors.controller.ts
 * @description Controller REST API doctors: endpoint HTTP. Data dokter: spesialisasi, jadwal, lisensi, profil terhubung user.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";
import { PaginationQueryDto } from "../../common/pagination/pagination";

import { DoctorsService } from "./doctors.service";
import { CreateDoctorDto } from "./dto/create-doctor.dto";
import { UpdateDoctorDto } from "./dto/update-doctor.dto";

@ApiTags("doctors")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("doctors")
export class DoctorsController {
  constructor(private readonly doctors: DoctorsService) {}

  @RequirePermissions("doctors.read")
  @Get()
  async list(@Query() query: PaginationQueryDto) {
    const result = await this.doctors.list(query);
    return { success: true, data: result.data, meta: result.meta };
  }

  @RequirePermissions("doctors.read")
  @Get(":id")
  get(@Param("id") id: string) {
    return this.doctors.get(id);
  }

  @RequirePermissions("doctors.write")
  @Post()
  create(@CurrentUser("sub") actorId: string, @Body() dto: CreateDoctorDto) {
    return this.doctors.create(actorId, dto);
  }

  @RequirePermissions("doctors.write")
  @Put(":id")
  update(@CurrentUser("sub") actorId: string, @Param("id") id: string, @Body() dto: UpdateDoctorDto) {
    return this.doctors.update(actorId, id, dto);
  }

  @RequirePermissions("doctors.write")
  @Delete(":id")
  remove(@CurrentUser("sub") actorId: string, @Param("id") id: string) {
    return this.doctors.remove(actorId, id);
  }
}

