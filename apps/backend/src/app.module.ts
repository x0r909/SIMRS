import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_INTERCEPTOR, APP_GUARD } from "@nestjs/core";
import { ScheduleModule } from "@nestjs/schedule";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";

import { AppController } from "./app.controller";
import { validateEnv } from "./config/env.schema";
import { AppointmentsModule } from "./modules/appointments/appointments.module";
import { AuditLogsModule } from "./modules/audit-logs/audit-logs.module";
import { AuthModule } from "./modules/auth/auth.module";
import { BackupModule } from "./modules/backup/backup.module";
import { BillingModule } from "./modules/billing/billing.module";
import { CaptchaModule } from "./modules/captcha/captcha.module";
import { DoctorsModule } from "./modules/doctors/doctors.module";
import { FilesModule } from "./modules/files/files.module";
import { LaboratoryModule } from "./modules/laboratory/laboratory.module";
import { MedicinesModule } from "./modules/medicines/medicines.module";
import { PatientsModule } from "./modules/patients/patients.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { QueuesModule } from "./modules/queues/queues.module";
import { RadiologyModule } from "./modules/radiology/radiology.module";
import { RolesModule } from "./modules/roles/roles.module";
import { UsersModule } from "./modules/users/users.module";
import { VisitsModule } from "./modules/visits/visits.module";
import { PrismaModule } from "./shared/prisma/prisma.module";
import { StorageModule } from "./shared/storage/storage.module";
import { AuditLoggingInterceptor } from "./modules/audit-logs/audit-logging.interceptor";

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
    StorageModule,
    AuthModule,
    CaptchaModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    AuditLogsModule,
    BackupModule,
    PatientsModule,
    DoctorsModule,
    AppointmentsModule,
    QueuesModule,
    VisitsModule,
    MedicinesModule,
    LaboratoryModule,
    RadiologyModule,
    BillingModule,
    FilesModule
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLoggingInterceptor,
    },
  ],
})
export class AppModule {}

