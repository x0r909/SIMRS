import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
<<<<<<< HEAD
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
=======
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)

import { AppController } from "./app.controller";
import { AccessControlModule } from "./common/auth/access-control.module";
import { AbacGuard } from "./common/auth/abac.guard";
import { MacGuard } from "./common/auth/mac.guard";
import { validateEnv } from "./config/env.schema";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { AuditLoggingInterceptor } from "./modules/audit-logs/audit-logging.interceptor";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BackupModule } from "./modules/backup/backup.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CaptchaModule } from "./modules/captcha/captcha.module";
import { DepartmentsModule } from "./modules/departments/departments.module";
import { DoctorsModule } from "./modules/doctors/doctors.module";
import { EncryptionModule } from "./modules/encryption/encryption.module";
import { FilesModule } from "./modules/files/files.module";
import { HealthModule } from "./modules/health/health.module";
import { HospitalsModule } from "./modules/hospitals/hospitals.module";
import { LaboratoryModule } from "./modules/laboratory/laboratory.module";
import { MedicalRecordsModule } from "./modules/medical-records/medical-records.module";
import { MedicinesModule } from "./modules/medicines/medicines.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { PrescriptionsModule } from "./modules/prescriptions/prescriptions.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { RadiologyModule } from "./modules/radiology/radiology.module";
import { RolesModule } from "./modules/roles/roles.module";
import { SystemLoggingInterceptor } from "./modules/system-logs/system-logging.interceptor";
import { SystemLogsModule } from "./modules/system-logs/system-logs.module";
import { SystemSettingsModule } from "./modules/system-settings/system-settings.module";
import { UsersModule } from "./modules/users/users.module";
import { VisitsModule } from "./modules/visits/visits.module";
import { ContextModule } from "./shared/context/context.module";
import { PrismaModule } from "./shared/prisma/prisma.module";
import { RedisModule } from "./shared/redis/redis.module";
import { StorageModule } from "./shared/storage/storage.module";

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      validate: validateEnv
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([
      {
        name: "short",
        ttl: 1000,
        limit: 10,
      },
      {
        name: "long",
        ttl: 60000,
        limit: 100,
      },
      {
        name: "login",
        ttl: 60000,
        limit: 5,
      },
    ]),
    PrismaModule,
    RedisModule,
    AccessControlModule,
    ContextModule,
    EncryptionModule,
    StorageModule,
    AuthModule,
    CaptchaModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    HospitalsModule,
    DepartmentsModule,
    AuditLogsModule,
    SystemLogsModule,
    SystemSettingsModule,
    HealthModule,
    BackupModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    QueuesModule,
    VisitsModule,
    MedicalRecordsModule,
    PrescriptionsModule,
    MedicinesModule,
    LaboratoryModule,
    RadiologyModule,
    BillingModule,
    ReportsModule,
    FilesModule,
    NotificationsModule
  ],
  providers: [
<<<<<<< HEAD
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
=======
    { provide: APP_INTERCEPTOR, useClass: AuditLoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: SystemLoggingInterceptor },
    { provide: APP_GUARD, useClass: AbacGuard },
    { provide: APP_GUARD, useClass: MacGuard }
  ]
>>>>>>> 0e7136b (Update besar besaran fitur pada frontend dan backend serta database)
})
export class AppModule {}
