/**
 * @file query.ts
 * @path packages/db/query.ts
 * @description Helper query SQL/Prisma untuk debugging atau laporan.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

﻿import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
(async () => {
  try {
    const patientRegisterCount = await prisma.auditLog.count({ where: { action: "PATIENT_REGISTER" } });
    const loginCount = await prisma.auditLog.count({ where: { action: "LOGIN" } });
    const recentLogs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5 });
    console.log("=== AUDIT LOG STATISTICS ===");
    console.log(`Total PATIENT_REGISTER actions: ${patientRegisterCount}`);
    console.log(`Total LOGIN actions: ${loginCount}`);
    console.log(`\n=== 5 MOST RECENT AUDIT LOGS ===`);
    recentLogs.forEach((log, i) => {
      console.log(`${i+1}. ID: ${log.id}, Action: ${log.action}, UserId: ${log.userId}, CreatedAt: ${log.createdAt}`);
    });
  } finally {
    await prisma.$disconnect();
  }
})();
