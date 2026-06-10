import { Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuditAction, AuditModule, AuditStatus, Prisma } from "@prisma/client";

import { PrismaService } from "../../shared/prisma/prisma.service";
import { AuditLogsService } from "../audit-logs/audit-logs.service";

import { UpdateMaintenanceDto } from "./dto/update-maintenance.dto";
import { UpdateSystemSettingsDto } from "./dto/update-system-settings.dto";
import { isPatientRole, isSystemAdminRole, type MaintenanceScope } from "./maintenance.util";
import {
  DEFAULT_HOSPITAL_SETTINGS,
  type HospitalOperationalSettings,
  type PublicSystemSettings,
  type SystemRuntimeInfo
} from "./system-settings.types";

export type MaintenanceStatus = {
  active: boolean;
  scope: MaintenanceScope;
  message: string;
  endsAt: string | null;
  hospitalName: string;
};

@Injectable()
export class SystemSettingsService {
  private publicCache: { expiresAt: number; value: PublicSystemSettings } | null = null;

  private readonly cacheTtlMs = 5_000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly audit: AuditLogsService
  ) {}

  async getDefaultHospital() {
    const hospital = await this.prisma.hospital.findFirst({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "asc" }
    });
    if (!hospital) {
      throw new NotFoundException("Rumah sakit default belum dikonfigurasi");
    }
    return hospital;
  }

  parseOperationalSettings(raw: Prisma.JsonValue | null): HospitalOperationalSettings {
    const base = { ...DEFAULT_HOSPITAL_SETTINGS };
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      return base;
    }
    const input = raw as Record<string, unknown>;
    const scope = input.maintenanceScope;
    const maintenanceScope: MaintenanceScope =
      scope === "registration" || scope === "patients" || scope === "full"
        ? scope
        : base.maintenanceScope;

    return {
      maintenanceMode: Boolean(input.maintenanceMode ?? base.maintenanceMode),
      maintenanceScope,
      maintenanceMessage: String(input.maintenanceMessage ?? base.maintenanceMessage),
      maintenanceEndsAt:
        input.maintenanceEndsAt === null
          ? null
          : input.maintenanceEndsAt !== undefined
            ? String(input.maintenanceEndsAt)
            : base.maintenanceEndsAt,
      allowPatientRegistration: Boolean(
        input.allowPatientRegistration ?? base.allowPatientRegistration
      ),
      backupRetentionDays: Number(input.backupRetentionDays ?? base.backupRetentionDays),
      timezone: String(input.timezone ?? base.timezone),
      locale: String(input.locale ?? base.locale),
      operatingHoursOpen: String(input.operatingHoursOpen ?? base.operatingHoursOpen),
      operatingHoursClose: String(input.operatingHoursClose ?? base.operatingHoursClose)
    };
  }

  getRuntimeInfo(): SystemRuntimeInfo {
    return {
      nodeEnv: this.config.get<string>("NODE_ENV", "development"),
      jwtAccessTtlSeconds: Number(this.config.get("JWT_ACCESS_TTL_SECONDS", 900)),
      jwtRefreshTtlSeconds: Number(this.config.get("JWT_REFRESH_TTL_SECONDS", 604800)),
      maxConcurrentSessions: Number(this.config.get("MAX_CONCURRENT_SESSIONS", 3)),
      logLevel: this.config.get<string>("LOG_LEVEL", "info"),
      prometheusEnabled:
        String(this.config.get("PROMETHEUS_METRICS_ENABLED", "true")).toLowerCase() === "true"
    };
  }

  async getSettings() {
    const hospital = await this.getDefaultHospital();
    return {
      hospital: {
        id: hospital.id,
        code: hospital.code,
        name: hospital.name,
        address: hospital.address,
        phone: hospital.phone,
        email: hospital.email,
        logoUrl: hospital.logoUrl,
        status: hospital.status
      },
      operational: this.parseOperationalSettings(hospital.settings),
      runtime: this.getRuntimeInfo()
    };
  }

  private invalidatePublicCache() {
    this.publicCache = null;
  }

  async getPublicSettings(): Promise<PublicSystemSettings> {
    if (this.publicCache && this.publicCache.expiresAt > Date.now()) {
      return this.publicCache.value;
    }

    const hospital = await this.getDefaultHospital();
    const operational = this.parseOperationalSettings(hospital.settings);
    const value = {
      maintenanceMode: operational.maintenanceMode,
      maintenanceScope: operational.maintenanceScope,
      maintenanceMessage: operational.maintenanceMessage,
      maintenanceEndsAt: operational.maintenanceEndsAt,
      allowPatientRegistration: operational.allowPatientRegistration,
      hospitalName: hospital.name
    };

    this.publicCache = { expiresAt: Date.now() + this.cacheTtlMs, value };
    return value;
  }

  async getMaintenanceStatus(): Promise<MaintenanceStatus> {
    const publicSettings = await this.getPublicSettings();
    const endsAt = publicSettings.maintenanceEndsAt;
    const expired = endsAt ? new Date(endsAt).getTime() <= Date.now() : false;

    if (publicSettings.maintenanceMode && expired) {
      await this.disableExpiredMaintenance();
      return {
        active: false,
        scope: "registration",
        message: publicSettings.maintenanceMessage,
        endsAt: null,
        hospitalName: publicSettings.hospitalName
      };
    }

    return {
      active: publicSettings.maintenanceMode,
      scope: publicSettings.maintenanceScope,
      message:
        publicSettings.maintenanceMessage ||
        "Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.",
      endsAt: publicSettings.maintenanceEndsAt,
      hospitalName: publicSettings.hospitalName
    };
  }

  private async disableExpiredMaintenance() {
    const hospital = await this.getDefaultHospital();
    const operational = this.parseOperationalSettings(hospital.settings);
    if (!operational.maintenanceMode) return;

    const nextOperational: HospitalOperationalSettings = {
      ...operational,
      maintenanceMode: false,
      maintenanceEndsAt: null
    };

    await this.prisma.hospital.update({
      where: { id: hospital.id },
      data: { settings: nextOperational as unknown as Prisma.InputJsonValue }
    });
    this.invalidatePublicCache();
  }

  async isPatientRegistrationAllowed(): Promise<boolean> {
    const status = await this.getMaintenanceStatus();
    if (status.active) {
      return false;
    }
    const hospital = await this.getDefaultHospital();
    const operational = this.parseOperationalSettings(hospital.settings);
    return operational.allowPatientRegistration;
  }

  async assertLoginAllowedDuringMaintenance(
    roles: string[],
    audience: "staff" | "patient"
  ): Promise<void> {
    const status = await this.getMaintenanceStatus();
    if (!status.active) return;

    if (isSystemAdminRole(roles)) return;

    if (audience === "patient" && status.scope !== "registration") {
      throw new UnauthorizedException(status.message);
    }

    if (audience === "staff" && status.scope === "full") {
      throw new UnauthorizedException(status.message);
    }
  }

  evaluateApiAccess(status: MaintenanceStatus, roles: string[], path: string): boolean {
    if (!status.active) return true;
    if (isSystemAdminRole(roles)) return true;

    if (path.includes("/auth/register-patient")) return false;

    if (status.scope === "registration") return true;

    if (status.scope === "patients") {
      return !isPatientRole(roles);
    }

    return false;
  }

  async setMaintenanceMode(actorId: string | undefined, dto: UpdateMaintenanceDto) {
    const hospital = await this.getDefaultHospital();
    const currentOperational = this.parseOperationalSettings(hospital.settings);

    const nextOperational: HospitalOperationalSettings = {
      ...currentOperational,
      maintenanceMode: dto.enabled,
      ...(dto.scope !== undefined ? { maintenanceScope: dto.scope } : {}),
      ...(dto.message !== undefined ? { maintenanceMessage: dto.message } : {}),
      ...(dto.endsAt !== undefined ? { maintenanceEndsAt: dto.endsAt } : {})
    };

    const updated = await this.prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        settings: nextOperational as unknown as Prisma.InputJsonValue
      }
    });

    this.invalidatePublicCache();

    await this.audit.create({
      actorId,
      action: AuditAction.OTHER,
      module: AuditModule.SYSTEM,
      entity: "Hospital",
      entityId: hospital.id,
      status: AuditStatus.SUCCESS,
      hospitalId: hospital.id,
      description: dto.enabled
        ? `Mode maintenance diaktifkan (${nextOperational.maintenanceScope})`
        : "Mode maintenance dinonaktifkan",
      metadata: { maintenance: dto }
    });

    return {
      hospital: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        logoUrl: updated.logoUrl,
        status: updated.status
      },
      operational: this.parseOperationalSettings(updated.settings),
      runtime: this.getRuntimeInfo()
    };
  }

  async updateSettings(actorId: string | undefined, dto: UpdateSystemSettingsDto) {
    const hospital = await this.getDefaultHospital();
    const currentOperational = this.parseOperationalSettings(hospital.settings);

    const profileData: Prisma.HospitalUpdateInput = {};
    if (dto.profile?.name !== undefined) profileData.name = dto.profile.name;
    if (dto.profile?.address !== undefined) profileData.address = dto.profile.address;
    if (dto.profile?.phone !== undefined) profileData.phone = dto.profile.phone;
    if (dto.profile?.email !== undefined) profileData.email = dto.profile.email;
    if (dto.profile?.logoUrl !== undefined) profileData.logoUrl = dto.profile.logoUrl;

    const nextOperational: HospitalOperationalSettings = {
      ...currentOperational,
      ...(dto.operational ?? {})
    };

    const maintenanceToggled =
      dto.operational?.maintenanceMode !== undefined &&
      dto.operational.maintenanceMode !== currentOperational.maintenanceMode;

    const updated = await this.prisma.hospital.update({
      where: { id: hospital.id },
      data: {
        ...profileData,
        settings: nextOperational as unknown as Prisma.InputJsonValue
      }
    });

    this.invalidatePublicCache();

    await this.audit.create({
      actorId,
      action: maintenanceToggled ? AuditAction.OTHER : AuditAction.OTHER,
      module: AuditModule.SYSTEM,
      entity: "Hospital",
      entityId: hospital.id,
      status: AuditStatus.SUCCESS,
      hospitalId: hospital.id,
      description: maintenanceToggled
        ? nextOperational.maintenanceMode
          ? `Mode maintenance diaktifkan (${nextOperational.maintenanceScope})`
          : "Mode maintenance dinonaktifkan"
        : "Pengaturan sistem diperbarui",
      metadata: { profile: dto.profile, operational: dto.operational }
    });

    return {
      hospital: {
        id: updated.id,
        code: updated.code,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        logoUrl: updated.logoUrl,
        status: updated.status
      },
      operational: this.parseOperationalSettings(updated.settings),
      runtime: this.getRuntimeInfo()
    };
  }
}
