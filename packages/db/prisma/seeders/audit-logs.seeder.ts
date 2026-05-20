import { AuditAction, AuditModule, AuditStatus } from '@prisma/client';
import { faker } from '@faker-js/faker';

export async function seedAuditLogs(prisma: any) {
  console.log('🌱 Seeding audit logs...');

  // Get some users from the database
  const users = await prisma.user.findMany({
    take: 5,
  });

  if (users.length === 0) {
    console.warn('⚠️  No users found. Skipping audit log seeding.');
    return;
  }

  const activities = [
    {
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
      description: 'User successfully logged in',
      entity: 'Authentication',
    },
    {
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
      description: 'User logged out',
      entity: 'Authentication',
    },
    {
      action: AuditAction.LOGIN_FAILED,
      module: AuditModule.AUTH,
      description: 'Failed login attempt',
      entity: 'Authentication',
      status: AuditStatus.FAILED,
    },
    {
      action: AuditAction.CHANGE_PASSWORD,
      module: AuditModule.AUTH,
      description: 'User changed password',
      entity: 'User',
    },
    {
      action: AuditAction.USER_CREATE,
      module: AuditModule.USER_MANAGEMENT,
      description: 'New user created',
      entity: 'User',
    },
    {
      action: AuditAction.USER_UPDATE,
      module: AuditModule.USER_MANAGEMENT,
      description: 'User information updated',
      entity: 'User',
    },
    {
      action: AuditAction.USER_DELETE,
      module: AuditModule.USER_MANAGEMENT,
      description: 'User account deleted',
      entity: 'User',
    },
    {
      action: AuditAction.ROLE_CHANGE,
      module: AuditModule.USER_MANAGEMENT,
      description: 'User role changed',
      entity: 'Role',
    },
    {
      action: AuditAction.PATIENT_REGISTER,
      module: AuditModule.PATIENT,
      description: 'New patient registered',
      entity: 'Patient',
    },
    {
      action: AuditAction.PATIENT_CREATE,
      module: AuditModule.PATIENT,
      description: 'Patient record created',
      entity: 'Patient',
    },
    {
      action: AuditAction.PATIENT_UPDATE,
      module: AuditModule.PATIENT,
      description: 'Patient information updated',
      entity: 'Patient',
    },
    {
      action: AuditAction.PATIENT_DELETE,
      module: AuditModule.PATIENT,
      description: 'Patient record deleted',
      entity: 'Patient',
    },
    {
      action: AuditAction.DIAGNOSIS_ADD,
      module: AuditModule.MEDICAL_RECORD,
      description: 'New diagnosis added to patient record',
      entity: 'Diagnosis',
    },
    {
      action: AuditAction.MEDICAL_RECORD_UPDATE,
      module: AuditModule.MEDICAL_RECORD,
      description: 'Medical record updated',
      entity: 'MedicalRecord',
    },
    {
      action: AuditAction.PRESCRIPTION_ADD,
      module: AuditModule.MEDICAL_RECORD,
      description: 'Prescription added to patient',
      entity: 'Prescription',
    },
    {
      action: AuditAction.LAB_RESULT_UPLOAD,
      module: AuditModule.LABORATORY,
      description: 'Laboratory test result uploaded',
      entity: 'LabResult',
    },
    {
      action: AuditAction.APPOINTMENT_BOOK,
      module: AuditModule.APPOINTMENT,
      description: 'Appointment scheduled',
      entity: 'Appointment',
    },
    {
      action: AuditAction.APPOINTMENT_RESCHEDULE,
      module: AuditModule.APPOINTMENT,
      description: 'Appointment rescheduled',
      entity: 'Appointment',
    },
    {
      action: AuditAction.APPOINTMENT_CANCEL,
      module: AuditModule.APPOINTMENT,
      description: 'Appointment cancelled',
      entity: 'Appointment',
    },
    {
      action: AuditAction.MEDICINE_STOCK_ADD,
      module: AuditModule.PHARMACY,
      description: 'Medicine stock added',
      entity: 'Medicine',
    },
    {
      action: AuditAction.MEDICINE_STOCK_UPDATE,
      module: AuditModule.PHARMACY,
      description: 'Medicine stock updated',
      entity: 'Medicine',
    },
    {
      action: AuditAction.MEDICINE_OUT,
      module: AuditModule.PHARMACY,
      description: 'Medicine dispensed from stock',
      entity: 'Medicine',
    },
    {
      action: AuditAction.DATABASE_BACKUP,
      module: AuditModule.SYSTEM,
      description: 'Database backup completed',
      entity: 'System',
    },
    {
      action: AuditAction.SYSTEM_ERROR,
      module: AuditModule.SYSTEM,
      description: 'System error occurred',
      entity: 'System',
      status: AuditStatus.ERROR,
    },
    {
      action: AuditAction.SETTING_UPDATE,
      module: AuditModule.SYSTEM,
      description: 'System setting updated',
      entity: 'Setting',
    },
  ];

  // Create 40 audit log entries spread across the last 30 days
  const auditLogs = [];
  for (let i = 0; i < 40; i++) {
    const activity = activities[i % activities.length];
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    createdAt.setHours(Math.floor(Math.random() * 24));
    createdAt.setMinutes(Math.floor(Math.random() * 60));

    auditLogs.push({
      ...activity,
      entityId: faker.string.uuid(),
      createdAt,
      actorId: users[Math.floor(Math.random() * users.length)].id,
      ip: faker.internet.ipv4(),
      userAgent: faker.internet.userAgent(),
      metadata: {
        endpoint: faker.lorem.word(),
        duration: Math.floor(Math.random() * 5000),
        details: faker.lorem.sentence(),
      },
    });
  }

  // Bulk create audit logs
  await prisma.auditLog.createMany({
    data: auditLogs,
    skipDuplicates: true,
  });

  console.log(`✅ Created ${auditLogs.length} audit log entries`);
}

// Seeder untuk mencatat audit logs dari seed data yang dibuat
export async function seedAuditLogsForSeededData(prisma: any) {
  console.log('🌱 Seeding audit logs for seeded data...');
  
  // Daftar email seed users
  const seedUserEmails = [
    "admin@simrs.local",
    "doctor@simrs.local",
    "cashier@simrs.local",
    "staff.rina@simrs.local",
    "apoteker.maya@simrs.local",
    "radiologi.eko@simrs.local",
    "lab.tuti@simrs.local",
    "pasien.andi@simrs.local"
  ];

  // Get seeded users
  const seedUsers = await prisma.user.findMany({
    where: {
      email: {
        in: seedUserEmails
      }
    }
  });

  // Get admin user untuk mencatat siapa yang membuat records ini
  const admin = seedUsers.find(u => u.email === "admin@simrs.local");
  
  // Daftar seed patients berdasarkan MRN
  const seedPatientMrns = ["MRN0001", "MRN0002", "MRN0003", "MRN0004"];
  const seedPatients = await prisma.patient.findMany({
    where: {
      mrn: {
        in: seedPatientMrns
      }
    }
  });

  // Daftar seed doctors berdasarkan code
  const seedDoctorCodes = ["DR001", "DR002", "DR003", "DR004"];
  const seedDoctors = await prisma.doctor.findMany({
    where: {
      code: {
        in: seedDoctorCodes
      }
    }
  });

  // Get seeded medicines
  const seedMedicineSKUs = ["MED001", "MED002", "MED003", "MED004"];
  const seedMedicines = await prisma.medicine.findMany({
    where: {
      sku: {
        in: seedMedicineSKUs
      }
    }
  });

  const auditLogsToCreate = [];
  const seedTime = new Date();
  seedTime.setDate(seedTime.getDate() - 1); // Created yesterday

  // Log untuk setiap user yang di-seed
  for (const user of seedUsers) {
    const isAdmin = user.email === "admin@simrs.local";
    auditLogsToCreate.push({
      action: AuditAction.USER_CREATE,
      module: AuditModule.USER_MANAGEMENT,
      entity: "User",
      entityId: user.id,
      status: AuditStatus.SUCCESS,
      actorId: isAdmin ? null : admin?.id,
      description: `System seeded user: ${user.email}`,
      metadata: {
        email: user.email,
        name: user.name,
        type: "SEED_DATA"
      },
      createdAt: seedTime,
      ip: "127.0.0.1",
      userAgent: "Seed Script"
    });

    // Log successful login untuk seeded patients
    if (user.email === "pasien.andi@simrs.local") {
      auditLogsToCreate.push({
        action: AuditAction.LOGIN,
        module: AuditModule.AUTH,
        entity: "User",
        status: AuditStatus.SUCCESS,
        actorId: user.id,
        description: `Patient portal user logged in: ${user.email}`,
        metadata: {
          email: user.email,
          name: user.name,
          type: "SEED_DATA"
        },
        createdAt: new Date(seedTime.getTime() + 60000),
        ip: "127.0.0.1",
        userAgent: "Seed Script"
      });
    }
  }

  // Log untuk setiap patient yang di-seed
  for (const patient of seedPatients) {
    const relatedUser = seedUsers.find(u => u.name === patient.name);
    auditLogsToCreate.push({
      action: AuditAction.PATIENT_REGISTER,
      module: AuditModule.PATIENT,
      entity: "Patient",
      entityId: patient.id,
      status: AuditStatus.SUCCESS,
      actorId: relatedUser?.id || admin?.id,
      description: `System seeded patient: ${patient.mrn}`,
      metadata: {
        mrn: patient.mrn,
        name: patient.name,
        type: "SEED_DATA"
      },
      createdAt: seedTime,
      ip: "127.0.0.1",
      userAgent: "Seed Script"
    });
  }

  // Log untuk setiap doctor yang di-seed
  for (const doctor of seedDoctors) {
    auditLogsToCreate.push({
      action: AuditAction.OTHER,
      module: AuditModule.SYSTEM,
      entity: "Doctor",
      entityId: doctor.id,
      status: AuditStatus.SUCCESS,
      actorId: admin?.id,
      description: `System seeded doctor: ${doctor.code}`,
      metadata: {
        code: doctor.code,
        name: doctor.name,
        specialty: doctor.specialty,
        type: "SEED_DATA"
      },
      createdAt: seedTime,
      ip: "127.0.0.1",
      userAgent: "Seed Script"
    });
  }

  // Log untuk setiap medicine yang di-seed
  for (const medicine of seedMedicines) {
    auditLogsToCreate.push({
      action: AuditAction.MEDICINE_STOCK_ADD,
      module: AuditModule.PHARMACY,
      entity: "Medicine",
      entityId: medicine.id,
      status: AuditStatus.SUCCESS,
      actorId: admin?.id,
      description: `System seeded medicine: ${medicine.sku}`,
      metadata: {
        sku: medicine.sku,
        name: medicine.name,
        stock: medicine.stock,
        type: "SEED_DATA"
      },
      createdAt: seedTime,
      ip: "127.0.0.1",
      userAgent: "Seed Script"
    });
  }

  // Bulk create audit logs
  if (auditLogsToCreate.length > 0) {
    await prisma.auditLog.createMany({
      data: auditLogsToCreate,
      skipDuplicates: true
    });
    console.log(`✅ Created ${auditLogsToCreate.length} audit log entries for seeded data`);
  } else {
    console.log("⚠️  No seeded data audit logs created");
  }
}
