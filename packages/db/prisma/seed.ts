import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const PERMISSION_KEYS = [
  "users.read", "users.write", "users.delete", "users.manage-roles", "users.force-logout",
  "roles.read", "roles.write", "permissions.read",
  "hospitals.read", "hospitals.write",
  "departments.read", "departments.write",
  "patients.read", "patients.write", "patients.delete", "patients.export",
  "doctors.read", "doctors.write",
  "appointments.read", "appointments.write", "appointments.cancel",
  "queues.read", "queues.write", "visits.read", "visits.write", "visits.manage-queue",
  "medical-records.read", "medical-records.write", "medical-records.finalize", "medical-records.read-restricted",
  "pharmacy.read", "pharmacy.write", "pharmacy.dispense", "pharmacy.inventory",
  "medicines.read", "medicines.write",
  "laboratory.read", "laboratory.write", "laboratory.verify",
  "radiology.read", "radiology.write", "radiology.verify",
  "billing.read", "billing.write", "billing.approve", "billing.export",
  "files.read", "files.write",
  "reports.read", "reports.export",
  "audit.read", "audit.export",
  "system-logs.read", "system-logs.export",
  "backup.create", "backup.restore", "backup.delete", "backup.download", "backup.schedule",
  "system.config", "system.maintenance", "system.key-rotation"
];

const ROLE_SEEDS: { key: string; name: string; description: string; isSystem: boolean; permissions: string[] }[] = [
  {
    key: "SYSTEM_ADMIN",
    name: "Admin Sistem",
    description: "Super admin teknis seluruh sistem",
    isSystem: true,
    permissions: [...PERMISSION_KEYS]
  },
  {
    key: "HOSPITAL_ADMIN",
    name: "Admin Rumah Sakit",
    description: "Manajer operasional RS",
    isSystem: true,
    permissions: [
      "users.read", "users.write", "departments.read", "departments.write",
      "patients.read", "patients.write", "doctors.read", "doctors.write",
      "appointments.read", "appointments.write", "queues.read", "queues.write",
      "visits.read", "billing.read", "billing.write", "billing.export",
      "medicines.read", "laboratory.read", "radiology.read", "pharmacy.read",
      "reports.read", "reports.export", "audit.read", "audit.export",
      "hospitals.read", "files.read", "files.write"
    ]
  },
  {
    key: "DOCTOR",
    name: "Dokter",
    description: "Tenaga medis",
    isSystem: true,
    permissions: [
      "patients.read", "doctors.read", "appointments.read", "appointments.write",
      "queues.read", "visits.read", "visits.write",
      "medical-records.read", "medical-records.write", "medical-records.finalize",
      "pharmacy.read", "medicines.read",
      "laboratory.read", "laboratory.write", "radiology.read", "radiology.write",
      "files.read", "files.write"
    ]
  },
  {
    key: "NURSE",
    name: "Perawat",
    description: "Tenaga keperawatan",
    isSystem: true,
    permissions: [
      "patients.read", "queues.read", "visits.read", "visits.write",
      "medical-records.read", "medical-records.write", "appointments.read"
    ]
  },
  {
    key: "CASHIER",
    name: "Kasir",
    description: "Pemroses pembayaran",
    isSystem: true,
    permissions: ["patients.read", "billing.read", "billing.write", "billing.approve", "reports.read"]
  },
  {
    key: "PHARMACIST",
    name: "Apoteker",
    description: "Pengelola farmasi",
    isSystem: true,
    permissions: [
      "patients.read", "pharmacy.read", "pharmacy.write", "pharmacy.dispense",
      "pharmacy.inventory", "medicines.read", "medicines.write"
    ]
  },
  {
    key: "RADIOLOGIST",
    name: "Radiologis",
    description: "Spesialis radiologi",
    isSystem: true,
    permissions: ["patients.read", "radiology.read", "radiology.write", "radiology.verify", "files.read", "files.write"]
  },
  {
    key: "LAB_ANALYST",
    name: "Analis Lab",
    description: "Analis laboratorium",
    isSystem: true,
    permissions: ["patients.read", "laboratory.read", "laboratory.write", "laboratory.verify", "files.read", "files.write"]
  },
  {
    key: "RECEPTIONIST",
    name: "Resepsionis",
    description: "Front desk dan registrasi",
    isSystem: true,
    permissions: [
      "patients.read", "patients.write", "doctors.read",
      "appointments.read", "appointments.write", "queues.read", "queues.write",
      "visits.read", "billing.read", "files.read"
    ]
  },
  {
    key: "PATIENT",
    name: "Pasien",
    description: "Portal pasien",
    isSystem: true,
    permissions: ["patients.read", "appointments.read", "visits.read", "billing.read", "medical-records.read"]
  }
];

const DEPARTMENTS = [
  { code: "UMUM", name: "Poli Umum" },
  { code: "IGD", name: "Instalasi Gawat Darurat" },
  { code: "FARMASI", name: "Farmasi" },
  { code: "LAB", name: "Laboratorium" },
  { code: "RAD", name: "Radiologi" },
  { code: "KASIR", name: "Kasir" }
];

async function main() {
  console.log("Seeding SIMRS v2...");

  const hospital = await prisma.hospital.upsert({
    where: { code: "RS-DEFAULT" },
    update: {},
    create: {
      code: "RS-DEFAULT",
      name: "Rumah Sakit SIMRS Demo",
      address: "Jl. Kesehatan No. 1, Jakarta",
      phone: "021-12345678",
      email: "info@simrs-demo.id",
      status: "ACTIVE"
    }
  });

  const departments: Record<string, string> = {};
  for (const dept of DEPARTMENTS) {
    const d = await prisma.department.upsert({
      where: { code_hospitalId: { code: dept.code, hospitalId: hospital.id } },
      update: {},
      create: { code: dept.code, name: dept.name, hospitalId: hospital.id }
    });
    departments[dept.code] = d.id;
  }

  const permissions: Record<string, string> = {};
  for (const key of PERMISSION_KEYS) {
    const [module, action] = key.split(".");
    const p = await prisma.permission.upsert({
      where: { key },
      update: { name: key, module, action },
      create: { key, name: key, module, action, description: key }
    });
    permissions[key] = p.id;
  }

  const roles: Record<string, string> = {};
  for (const roleSeed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: { key: roleSeed.key },
      update: { name: roleSeed.name, description: roleSeed.description, isSystem: roleSeed.isSystem },
      create: {
        key: roleSeed.key,
        name: roleSeed.name,
        description: roleSeed.description,
        isSystem: roleSeed.isSystem
      }
    });
    roles[roleSeed.key] = role.id;

    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    for (const permKey of roleSeed.permissions) {
      const permId = permissions[permKey];
      if (permId) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permId }
        });
      }
    }
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);

  const systemAdmin = await prisma.user.upsert({
    where: { email: "admin@simrs.local" },
    update: {},
    create: {
      email: "admin@simrs.local",
      name: "System Administrator",
      passwordHash,
      status: "ACTIVE",
      hospitalId: hospital.id
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: systemAdmin.id, roleId: roles.SYSTEM_ADMIN } },
    update: {},
    create: { userId: systemAdmin.id, roleId: roles.SYSTEM_ADMIN }
  });

  const hospitalAdmin = await prisma.user.upsert({
    where: { email: "hospital-admin@simrs.local" },
    update: {},
    create: {
      email: "hospital-admin@simrs.local",
      name: "Admin Rumah Sakit",
      passwordHash,
      status: "ACTIVE",
      hospitalId: hospital.id,
      departmentId: departments.UMUM
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: hospitalAdmin.id, roleId: roles.HOSPITAL_ADMIN } },
    update: {},
    create: { userId: hospitalAdmin.id, roleId: roles.HOSPITAL_ADMIN }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@simrs.local" },
    update: {},
    create: {
      email: "doctor@simrs.local",
      name: "Dr. Budi Santoso",
      passwordHash,
      status: "ACTIVE",
      hospitalId: hospital.id,
      departmentId: departments.UMUM
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: doctorUser.id, roleId: roles.DOCTOR } },
    update: {},
    create: { userId: doctorUser.id, roleId: roles.DOCTOR }
  });

  const doctor = await prisma.doctor.upsert({
    where: { code: "DOC001" },
    update: {},
    create: {
      code: "DOC001",
      name: "Dr. Budi Santoso",
      specialization: "Penyakit Dalam",
      specialty: "Penyakit Dalam",
      licenseNumber: "STR-001",
      userId: doctorUser.id,
      departmentId: departments.UMUM
    }
  });

  const staffUsers = [
    { email: "receptionist@simrs.local", name: "Siti Resepsionis", role: "RECEPTIONIST", dept: "UMUM" },
    { email: "nurse@simrs.local", name: "Ani Perawat", role: "NURSE", dept: "IGD" },
    { email: "cashier@simrs.local", name: "Dewi Kasir", role: "CASHIER", dept: "KASIR" },
    { email: "pharmacist@simrs.local", name: "Rina Apoteker", role: "PHARMACIST", dept: "FARMASI" },
    { email: "lab@simrs.local", name: "Andi Analis Lab", role: "LAB_ANALYST", dept: "LAB" },
    { email: "radiology@simrs.local", name: "Eko Radiolog", role: "RADIOLOGIST", dept: "RAD" }
  ];

  for (const su of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: su.email },
      update: {},
      create: {
        email: su.email,
        name: su.name,
        passwordHash,
        status: "ACTIVE",
        hospitalId: hospital.id,
        departmentId: departments[su.dept]
      }
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: roles[su.role] } },
      update: {},
      create: { userId: user.id, roleId: roles[su.role] }
    });
  }

  const patientUser = await prisma.user.upsert({
    where: { email: "patient@simrs.local" },
    update: {},
    create: {
      email: "patient@simrs.local",
      name: "Pasien Demo",
      passwordHash,
      status: "ACTIVE",
      hospitalId: hospital.id
    }
  });
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: patientUser.id, roleId: roles.PATIENT } },
    update: {},
    create: { userId: patientUser.id, roleId: roles.PATIENT }
  });

  const patient = await prisma.patient.upsert({
    where: { mrn_hospitalId: { mrn: "MRN-2026-0001", hospitalId: hospital.id } },
    update: {},
    create: {
      mrn: "MRN-2026-0001",
      name: "Pasien Demo",
      gender: "MALE",
      phone: "081234567890",
      hospitalId: hospital.id,
      departmentId: departments.UMUM,
      userId: patientUser.id
    }
  });

  const existingVisit = await prisma.visit.findFirst({
    where: { patientId: patient.id, doctorId: doctor.id }
  });

  if (!existingVisit) {
    const appointment = await prisma.appointment.create({
      data: {
        scheduledAt: new Date(),
        status: "SCHEDULED",
        patientId: patient.id,
        doctorId: doctor.id,
        hospitalId: hospital.id,
        departmentId: departments.UMUM
      }
    });

    const visit = await prisma.visit.create({
      data: {
        patientId: patient.id,
        doctorId: doctor.id,
        appointmentId: appointment.id,
        hospitalId: hospital.id,
        departmentId: departments.UMUM,
        status: "IN_PROGRESS",
        queueNumber: "A001"
      }
    });

    await prisma.medicalRecord.create({
      data: {
        visitId: visit.id,
        chiefComplaint: "Demam dan batuk 3 hari",
        status: "IN_PROGRESS",
        confidentialityLevel: "CONFIDENTIAL",
        vitalSigns: { temperature: 38.2, bloodPressure: "120/80", pulse: 88 }
      }
    });
  }

  await prisma.medicine.upsert({
    where: { sku: "MED-001" },
    update: {},
    create: { sku: "MED-001", name: "Paracetamol 500mg", unit: "tablet", stock: 500, price: 500, minStock: 50 }
  });

  console.log("Seed completed.");
  console.log("  Hospital:", hospital.name);
  console.log("  Login: admin@simrs.local / Admin123!");
  console.log("  Doctor: doctor@simrs.local / Admin123!");
  console.log("  Patient: patient@simrs.local / Admin123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
