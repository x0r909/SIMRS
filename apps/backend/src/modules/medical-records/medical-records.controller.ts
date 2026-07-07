/**
 * @file medical-records.controller.ts
 * @path apps/backend/src/modules/medical-records/medical-records.controller.ts
 * @description Controller REST API medical-records: endpoint HTTP. Rekam medis elektronik: SOAP, diagnosis ICD, finalisasi, kerahasiaan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { AbacPolicy } from "../../common/decorators/abac-policy.decorator";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { AbacGuard } from "../../common/auth/abac.guard";
import { RequirePermissions } from "../../common/auth/permissions.decorator";
import { PermissionsGuard } from "../../common/auth/permissions.guard";

import { MedicalRecordsService } from "./medical-records.service";

@ApiTags("medical-records")
@Controller("medical-records")
@UseGuards(JwtAuthGuard, PermissionsGuard, AbacGuard)
export class MedicalRecordsController {
  constructor(private readonly medicalRecords: MedicalRecordsService) {}

  @Get("visit/:visitId")
  @RequirePermissions("medical-records.read")
  @AbacPolicy("doctor_patient")
  getByVisit(@Param("visitId") visitId: string) {
    return this.medicalRecords.getByVisit(visitId);
  }

  @Get(":id")
  @RequirePermissions("medical-records.read")
  get(@Param("id") id: string) {
    return this.medicalRecords.get(id);
  }

  @Post("visit/:visitId")
  @RequirePermissions("medical-records.write")
  create(
    @Param("visitId") visitId: string,
    @CurrentUser("sub") actorId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.medicalRecords.create(visitId, actorId, body);
  }

  @Patch(":id")
  @RequirePermissions("medical-records.write")
  update(
    @Param("id") id: string,
    @CurrentUser("sub") actorId: string,
    @Body() body: Record<string, unknown>
  ) {
    return this.medicalRecords.update(id, actorId, body);
  }

  @Post(":id/finalize")
  @RequirePermissions("medical-records.finalize")
  finalize(
    @Param("id") id: string,
    @CurrentUser("sub") actorId: string,
    @Body() body: { signatureData?: string }
  ) {
    return this.medicalRecords.finalize(id, actorId, body.signatureData);
  }

  @Post(":id/addendum")
  @RequirePermissions("medical-records.write")
  addendum(
    @Param("id") id: string,
    @CurrentUser("sub") actorId: string,
    @Body() body: { text: string }
  ) {
    return this.medicalRecords.addendum(id, actorId, body.text);
  }
}
