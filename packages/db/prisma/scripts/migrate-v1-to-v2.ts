/**
 * @file migrate-v1-to-v2.ts
 * @path packages/db/prisma/scripts/migrate-v1-to-v2.ts
 * @description Package monorepo: packages/db/prisma/scripts/migrate-v1-to-v2.ts.
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */

/**
 * One-time data migration script from SIMRS v1.x schema to v2.
 * Run AFTER applying migration 20260610120000_v2_schema on a database with v1 data.
 *
 * Usage: tsx prisma/scripts/migrate-v1-to-v2.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting v1 → v2 data migration...");

  const hospital = await prisma.hospital.upsert({
    where: { code: "RS-DEFAULT" },
    update: {},
    create: {
      code: "RS-DEFAULT",
      name: "Rumah Sakit SIMRS",
      address: "Alamat Default",
      phone: "000",
      email: "info@simrs.local",
      status: "ACTIVE"
    }
  });

  const defaultDept = await prisma.department.upsert({
    where: { code_hospitalId: { code: "UMUM", hospitalId: hospital.id } },
    update: {},
    create: { code: "UMUM", name: "Poli Umum", hospitalId: hospital.id }
  });

  const roleMap: Record<string, string> = {
    admin: "SYSTEM_ADMIN",
    doctor: "DOCTOR",
    staff: "RECEPTIONIST",
    pharmacy: "PHARMACIST",
    radiology: "RADIOLOGIST",
    lab: "LAB_ANALYST",
    cashier: "CASHIER",
    patient: "PATIENT"
  };

  for (const [oldKey, newKey] of Object.entries(roleMap)) {
    const oldRole = await prisma.role.findUnique({ where: { key: oldKey } });
    if (oldRole) {
      await prisma.role.update({ where: { id: oldRole.id }, data: { key: newKey, isSystem: true } });
    }
  }

  await prisma.user.updateMany({
    where: { hospitalId: null },
    data: { hospitalId: hospital.id }
  });

  const patientsWithoutHospital = await prisma.patient.findMany({ where: { hospitalId: undefined as never } });
  for (const p of patientsWithoutHospital) {
    await prisma.patient.update({
      where: { id: p.id },
      data: { hospitalId: hospital.id, departmentId: defaultDept.id }
    });
  }

  const visits = await prisma.visit.findMany({ where: { hospitalId: undefined as never } });
  for (const v of visits) {
    await prisma.visit.update({
      where: { id: v.id },
      data: { hospitalId: hospital.id, departmentId: defaultDept.id }
    });

    const existingMr = await prisma.medicalRecord.findUnique({ where: { visitId: v.id } });
    if (!existingMr && (v.complaint || v.diagnosis)) {
      await prisma.medicalRecord.create({
        data: {
          visitId: v.id,
          chiefComplaint: v.complaint,
          diagnosisEncrypted: v.diagnosis,
          status: "DRAFT",
          confidentialityLevel: "INTERNAL"
        }
      });
    }
  }

  console.log("Migration completed for hospital:", hospital.id);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
