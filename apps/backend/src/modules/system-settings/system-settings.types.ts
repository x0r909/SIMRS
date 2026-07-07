/**
 * @file system-settings.types.ts
 * @path apps/backend/src/modules/system-settings/system-settings.types.ts
 * @description Definisi tipe TypeScript modul system-settings.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

import type { MaintenanceScope } from "./maintenance.util";

export type HospitalOperationalSettings = {
  maintenanceMode: boolean;
  maintenanceScope: MaintenanceScope;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  allowPatientRegistration: boolean;
  backupRetentionDays: number;
  timezone: string;
  locale: string;
  operatingHoursOpen: string;
  operatingHoursClose: string;
};

export const DEFAULT_HOSPITAL_SETTINGS: HospitalOperationalSettings = {
  maintenanceMode: false,
  maintenanceScope: "registration",
  maintenanceMessage: "Sistem sedang dalam pemeliharaan. Silakan coba lagi nanti.",
  maintenanceEndsAt: null,
  allowPatientRegistration: true,
  backupRetentionDays: 30,
  timezone: "Asia/Jakarta",
  locale: "id-ID",
  operatingHoursOpen: "07:00",
  operatingHoursClose: "21:00"
};

export type PublicSystemSettings = {
  maintenanceMode: boolean;
  maintenanceScope: MaintenanceScope;
  maintenanceMessage: string;
  maintenanceEndsAt: string | null;
  allowPatientRegistration: boolean;
  hospitalName: string;
};

export type SystemRuntimeInfo = {
  nodeEnv: string;
  jwtAccessTtlSeconds: number;
  jwtRefreshTtlSeconds: number;
  maxConcurrentSessions: number;
  logLevel: string;
  prometheusEnabled: boolean;
};
