import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const ALL_PERMISSION_KEYS = [
  // users/roles/permissions
  "users.read",
  "users.write",
  "roles.read",
  "roles.write",
  "permissions.read",
  // operational domains used by current API
  "patients.read",
  "patients.write",
  "doctors.read",
  "doctors.write",
  "appointments.read",
  "appointments.write",
  "queues.read",
  "queues.write",
  "visits.read",
  "visits.write",
  "medicines.read",
  "medicines.write",
  "billing.read",
  "billing.write",
  "files.read",
  "files.write",
  "audit.read",
  // extension keys to mirror reference SQL modules
  "pharmacy.read",
  "pharmacy.write",
  "laboratory.read",
  "laboratory.write",
  "radiology.read",
  "radiology.write"
];

type RoleSeed = {
  key: string;
  name: string;
  description: string;
  permissionKeys: string[];
};

const ROLE_SEEDS: RoleSeed[] = [
  {
    key: "admin",
    name: "Admin",
    description: "Kontrol penuh seluruh sistem",
    permissionKeys: [...ALL_PERMISSION_KEYS]
  },
  {
    key: "doctor",
    name: "Doctor",
    description: "Akses EMR dan tindakan klinis",
    permissionKeys: [
      "patients.read",
      "doctors.read",
      "appointments.read",
      "appointments.write",
      "queues.read",
      "visits.read",
      "visits.write",
      "medicines.read",
      "laboratory.read",
      "laboratory.write",
      "radiology.read",
      "radiology.write"
    ]
  },
  {
    key: "staff",
    name: "Staff",
    description: "Front office dan administrasi",
    permissionKeys: [
      "patients.read",
      "patients.write",
      "doctors.read",
      "appointments.read",
      "appointments.write",
      "queues.read",
      "queues.write",
      "visits.read",
      "billing.read"
    ]
  },
  {
    key: "pharmacy",
    name: "Pharmacy",
    description: "Kelola obat dan resep",
    permissionKeys: [
      "patients.read",
      "visits.read",
      "medicines.read",
      "medicines.write",
      "pharmacy.read",
      "pharmacy.write"
    ]
  },
  {
    key: "radiology",
    name: "Radiology",
    description: "Order dan hasil radiologi",
    permissionKeys: ["patients.read", "visits.read", "radiology.read", "radiology.write"]
  },
  {
    key: "lab",
    name: "Lab",
    description: "Order dan hasil laboratorium",
    permissionKeys: ["patients.read", "visits.read", "laboratory.read", "laboratory.write"]
  },
  {
    key: "cashier",
    name: "Cashier",
    description: "Billing dan pembayaran",
    permissionKeys: ["patients.read", "visits.read", "billing.read", "billing.write"]
  },
  {
    key: "patient",
    name: "Patient",
    description: "Portal pasien",
    permissionKeys: ["patients.read", "appointments.read", "visits.read", "billing.read"]
  }
];

async function main() {
  const permissions = ALL_PERMISSION_KEYS.map((key) => ({
    key,
    name: key
  }));

  await prisma.permission.createMany({
    data: permissions,
    skipDuplicates: true
  });

  const allPerms = await prisma.permission.findMany({ select: { id: true, key: true } });

  const roleByKey = new Map<string, { id: string }>();
  for (const roleSeed of ROLE_SEEDS) {
    const role = await prisma.role.upsert({
      where: { key: roleSeed.key },
      update: { name: roleSeed.name, description: roleSeed.description },
      create: { key: roleSeed.key, name: roleSeed.name, description: roleSeed.description }
    });
    roleByKey.set(roleSeed.key, role);

    const rolePerms = allPerms.filter((p) => roleSeed.permissionKeys.includes(p.key));
    await prisma.rolePermission.createMany({
      data: rolePerms.map((p) => ({ roleId: role.id, permissionId: p.id })),
      skipDuplicates: true
    });
  }

  const passwordHash = await bcrypt.hash("Admin123!", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@simrs.local" },
    update: { name: "SIMRS Admin", passwordHash, status: "ACTIVE" },
    create: { email: "admin@simrs.local", name: "SIMRS Admin", passwordHash, status: "ACTIVE" }
  });

  const doctorUser = await prisma.user.upsert({
    where: { email: "doctor@simrs.local" },
    update: { name: "Dr. Andi", passwordHash, status: "ACTIVE" },
    create: { email: "doctor@simrs.local", name: "Dr. Andi", passwordHash, status: "ACTIVE" }
  });

  const cashierUser = await prisma.user.upsert({
    where: { email: "cashier@simrs.local" },
    update: { name: "Kasir SIMRS", passwordHash, status: "ACTIVE" },
    create: { email: "cashier@simrs.local", name: "Kasir SIMRS", passwordHash, status: "ACTIVE" }
  });

  const staffUser = await prisma.user.upsert({
    where: { email: "staff.rina@simrs.local" },
    update: { name: "Rina Wulandari", passwordHash, status: "ACTIVE" },
    create: { email: "staff.rina@simrs.local", name: "Rina Wulandari", passwordHash, status: "ACTIVE" }
  });

  const pharmacyUser = await prisma.user.upsert({
    where: { email: "apoteker.maya@simrs.local" },
    update: { name: "Maya Sari", passwordHash, status: "ACTIVE" },
    create: { email: "apoteker.maya@simrs.local", name: "Maya Sari", passwordHash, status: "ACTIVE" }
  });

  const radiologyUser = await prisma.user.upsert({
    where: { email: "radiologi.eko@simrs.local" },
    update: { name: "Eko Pratama", passwordHash, status: "ACTIVE" },
    create: { email: "radiologi.eko@simrs.local", name: "Eko Pratama", passwordHash, status: "ACTIVE" }
  });

  const labUser = await prisma.user.upsert({
    where: { email: "lab.tuti@simrs.local" },
    update: { name: "Tuti Lestari", passwordHash, status: "ACTIVE" },
    create: { email: "lab.tuti@simrs.local", name: "Tuti Lestari", passwordHash, status: "ACTIVE" }
  });

  const patientPortalUser = await prisma.user.upsert({
    where: { email: "pasien.andi@simrs.local" },
    update: { name: "Andi Wijaya", passwordHash, status: "ACTIVE" },
    create: { email: "pasien.andi@simrs.local", name: "Andi Wijaya", passwordHash, status: "ACTIVE" }
  });

  const requireRoleId = (key: string) => {
    const role = roleByKey.get(key);
    if (!role) throw new Error(`Role ${key} not found during seed`);
    return role.id;
  };

  const userRolePairs: Array<{ userId: string; roleKey: string }> = [
    { userId: admin.id, roleKey: "admin" },
    { userId: doctorUser.id, roleKey: "doctor" },
    { userId: cashierUser.id, roleKey: "cashier" },
    { userId: staffUser.id, roleKey: "staff" },
    { userId: pharmacyUser.id, roleKey: "pharmacy" },
    { userId: radiologyUser.id, roleKey: "radiology" },
    { userId: labUser.id, roleKey: "lab" },
    { userId: patientPortalUser.id, roleKey: "patient" }
  ];

  for (const pair of userRolePairs) {
    const roleId = requireRoleId(pair.roleKey);
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: pair.userId, roleId } },
      update: {},
      create: { userId: pair.userId, roleId }
    });
  }

  await prisma.doctor.upsert({
    where: { code: "DR001" },
    update: { name: "dr. Budi Santoso", specialty: "Penyakit Dalam" },
    create: {
      code: "DR001",
      name: "dr. Budi Santoso",
      specialty: "Penyakit Dalam",
      phone: "08111234567"
    }
  });

  const doctor2 = await prisma.doctor.upsert({
    where: { code: "DR002" },
    update: { name: "dr. Siti Rahma", specialty: "Bedah Umum" },
    create: { code: "DR002", name: "dr. Siti Rahma", specialty: "Bedah Umum", phone: "08222345678" }
  });

  await prisma.doctor.upsert({
    where: { code: "DR003" },
    update: { name: "dr. Ahmad Fauzi", specialty: "Anak" },
    create: { code: "DR003", name: "dr. Ahmad Fauzi", specialty: "Anak", phone: "08333456789" }
  });

  await prisma.doctor.upsert({
    where: { code: "DR004" },
    update: { name: "dr. Dewi Lestari", specialty: "Umum" },
    create: { code: "DR004", name: "dr. Dewi Lestari", specialty: "Umum", phone: "08444567890" }
  });

  const patient1 = await prisma.patient.upsert({
    where: { mrn: "MRN0001" },
    update: { name: "Andi Wijaya" },
    create: { mrn: "MRN0001", name: "Andi Wijaya", phone: "08511112222", address: "Bandung" }
  });

  const patient2 = await prisma.patient.upsert({
    where: { mrn: "MRN0002" },
    update: { name: "Fitri Handayani" },
    create: { mrn: "MRN0002", name: "Fitri Handayani", phone: "08622223333", address: "Bandung" }
  });

  const patient3 = await prisma.patient.upsert({
    where: { mrn: "MRN0003" },
    update: { name: "Riko Pratama" },
    create: { mrn: "MRN0003", name: "Riko Pratama", phone: "08733334444", address: "Bandung" }
  });

  const patient4 = await prisma.patient.upsert({
    where: { mrn: "MRN0004" },
    update: { name: "Lina Susanti" },
    create: { mrn: "MRN0004", name: "Lina Susanti", phone: "08844445555", address: "Bandung" }
  });

  let patientPortalProfile = await prisma.patient.findUnique({ where: { id: patientPortalUser.id } });
  if (!patientPortalProfile) {
    const portalMrn = `MRNPT${patientPortalUser.id.slice(-6).toUpperCase()}`;
    patientPortalProfile = await prisma.patient.create({
      data: {
        id: patientPortalUser.id,
        mrn: portalMrn,
        name: patientPortalUser.name,
        phone: "08999990000",
        address: "Bandung"
      }
    });
  } else {
    patientPortalProfile = await prisma.patient.update({
      where: { id: patientPortalProfile.id },
      data: { name: patientPortalUser.name }
    });
  }

  await prisma.medicine.upsert({
    where: { sku: "MED001" },
    update: { name: "Paracetamol 500mg", stock: 500, price: 1500 },
    create: { sku: "MED001", name: "Paracetamol 500mg", unit: "tablet", stock: 500, price: 1500 }
  });

  await prisma.medicine.upsert({
    where: { sku: "MED002" },
    update: { name: "Amoxicillin 500mg", stock: 300, price: 3500 },
    create: { sku: "MED002", name: "Amoxicillin 500mg", unit: "capsule", stock: 300, price: 3500 }
  });

  await prisma.medicine.upsert({
    where: { sku: "MED003" },
    update: { name: "Omeprazole 20mg", stock: 200, price: 5000 },
    create: { sku: "MED003", name: "Omeprazole 20mg", unit: "capsule", stock: 200, price: 5000 }
  });

  await prisma.medicine.upsert({
    where: { sku: "MED004" },
    update: { name: "Amlodipine 5mg", stock: 150, price: 8000 },
    create: { sku: "MED004", name: "Amlodipine 5mg", unit: "tablet", stock: 150, price: 8000 }
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  let seedAppointment = await prisma.appointment.findFirst({
    where: { notes: "[seed] initial appointment - hipertensi" }
  });

  if (!seedAppointment) {
    seedAppointment = await prisma.appointment.create({
      data: {
        patientId: patient1.id,
        doctorId: doctor2.id,
        scheduledAt: tomorrow,
        notes: "[seed] initial appointment - hipertensi"
      }
    });
  }

  const dayAfterTomorrow = new Date(tomorrow);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
  let seedAppointment2 = await prisma.appointment.findFirst({
    where: { notes: "[seed] initial appointment - demam anak" }
  });
  if (!seedAppointment2) {
    seedAppointment2 = await prisma.appointment.create({
      data: {
        patientId: patient3.id,
        doctorId: doctor2.id,
        scheduledAt: dayAfterTomorrow,
        notes: "[seed] initial appointment - demam anak"
      }
    });
  }

  const patientPortalSchedule = new Date(dayAfterTomorrow);
  patientPortalSchedule.setDate(patientPortalSchedule.getDate() + 1);
  let patientPortalAppointment = await prisma.appointment.findFirst({
    where: { notes: "[seed] patient portal appointment" }
  });
  if (!patientPortalAppointment) {
    patientPortalAppointment = await prisma.appointment.create({
      data: {
        patientId: patientPortalProfile.id,
        doctorId: doctor2.id,
        scheduledAt: patientPortalSchedule,
        notes: "[seed] patient portal appointment"
      }
    });
  }

  const queueToday = new Date();
  queueToday.setHours(8, 0, 0, 0);
  const queueDayStart = new Date(queueToday);
  queueDayStart.setHours(0, 0, 0, 0);
  const queueDayEnd = new Date(queueToday);
  queueDayEnd.setHours(23, 59, 59, 999);

  const existingQueue = await prisma.queueEntry.findFirst({
    where: {
      patientId: patient2.id,
      date: { gte: queueDayStart, lte: queueDayEnd }
    }
  });

  if (!existingQueue) {
    const nextNoAgg = await prisma.queueEntry.aggregate({
      where: { date: { gte: queueDayStart, lte: queueDayEnd } },
      _max: { number: true }
    });
    await prisma.queueEntry.create({
      data: {
        patientId: patient2.id,
        doctorId: doctor2.id,
        date: queueToday,
        number: (nextNoAgg._max.number ?? 0) + 1,
        status: "WAITING"
      }
    });
  }

  for (const queueSeed of [
    { patientId: patient1.id, doctorId: doctor2.id, status: "DONE" },
    { patientId: patient3.id, doctorId: doctor2.id, status: "IN_SERVICE" },
    { patientId: patient4.id, doctorId: doctor2.id, status: "WAITING" }
  ] as const) {
    const exists = await prisma.queueEntry.findFirst({
      where: {
        patientId: queueSeed.patientId,
        date: { gte: queueDayStart, lte: queueDayEnd }
      }
    });
    if (exists) continue;

    const nextNoAgg = await prisma.queueEntry.aggregate({
      where: { date: { gte: queueDayStart, lte: queueDayEnd } },
      _max: { number: true }
    });

    await prisma.queueEntry.create({
      data: {
        patientId: queueSeed.patientId,
        doctorId: queueSeed.doctorId,
        date: queueToday,
        number: (nextNoAgg._max.number ?? 0) + 1,
        status: queueSeed.status
      }
    });
  }

  let seedVisit = await prisma.visit.findFirst({ where: { complaint: "[seed] pusing, tekanan darah tinggi" } });
  if (!seedVisit) {
    seedVisit = await prisma.visit.create({
      data: {
        patientId: patient1.id,
        doctorId: doctor2.id,
        appointmentId: seedAppointment.id,
        complaint: "[seed] pusing, tekanan darah tinggi",
        diagnosis: "[seed] hipertensi esensial"
      }
    });
  }

  let seedVisit2 = await prisma.visit.findFirst({ where: { complaint: "[seed] demam anak" } });
  if (!seedVisit2) {
    seedVisit2 = await prisma.visit.create({
      data: {
        patientId: patient3.id,
        doctorId: doctor2.id,
        appointmentId: seedAppointment2.id,
        complaint: "[seed] demam anak",
        diagnosis: "[seed] faringitis akut"
      }
    });
  }

  let patientPortalVisit = await prisma.visit.findFirst({
    where: { complaint: "[seed] kontrol pasien portal" }
  });
  if (!patientPortalVisit) {
    patientPortalVisit = await prisma.visit.create({
      data: {
        patientId: patientPortalProfile.id,
        doctorId: doctor2.id,
        appointmentId: patientPortalAppointment.id,
        complaint: "[seed] kontrol pasien portal",
        diagnosis: "[seed] observasi pasca terapi",
        endedAt: new Date()
      }
    });
  }

  let labOrder1 = await prisma.laboratoryOrder.findFirst({
    where: { visitId: seedVisit.id, testType: "Darah Lengkap, Kolesterol, Gula Darah" }
  });
  if (!labOrder1) {
    labOrder1 = await prisma.laboratoryOrder.create({
      data: {
        visitId: seedVisit.id,
        doctorId: doctor2.id,
        testType: "Darah Lengkap, Kolesterol, Gula Darah",
        notes: "[seed] cek rutin hipertensi",
        status: "SELESAI"
      }
    });
  }

  const hasLabResult1 = await prisma.laboratoryResult.findFirst({
    where: { orderId: labOrder1.id, parameter: "Hemoglobin" }
  });
  if (!hasLabResult1) {
    await prisma.laboratoryResult.createMany({
      data: [
        {
          orderId: labOrder1.id,
          parameter: "Hemoglobin",
          value: "12.5",
          unit: "g/dL",
          normalRange: "12-16",
          notes: "Normal"
        },
        {
          orderId: labOrder1.id,
          parameter: "Kolesterol Total",
          value: "220",
          unit: "mg/dL",
          normalRange: "<200",
          notes: "Tinggi"
        }
      ]
    });
  }

  let radiologyOrder1 = await prisma.radiologyOrder.findFirst({
    where: { visitId: seedVisit2.id, examType: "Foto Thorax PA" }
  });
  if (!radiologyOrder1) {
    radiologyOrder1 = await prisma.radiologyOrder.create({
      data: {
        visitId: seedVisit2.id,
        doctorId: doctor2.id,
        examType: "Foto Thorax PA",
        notes: "[seed] evaluasi pneumonia",
        status: "SELESAI"
      }
    });
  }

  const hasRadiologyResult1 = await prisma.radiologyResult.findFirst({
    where: { orderId: radiologyOrder1.id }
  });
  if (!hasRadiologyResult1) {
    await prisma.radiologyResult.create({
      data: {
        orderId: radiologyOrder1.id,
        description: "Tampak infiltrat di paru kanan bawah",
        impression: "Pneumonia lobus kanan bawah",
        filePath: "/storage/radiologi/thorax_seed_pasien_20260406.jpg"
      }
    });
  }

  const existingInvoice = await prisma.billingInvoice.findFirst({ where: { visitId: seedVisit.id } });
  if (!existingInvoice) {
    await prisma.billingInvoice.upsert({
      where: { number: "INV-SEED-0001" },
      update: {
        visitId: seedVisit.id,
        status: "UNPAID",
        total: 35000
      },
      create: {
        number: "INV-SEED-0001",
        visitId: seedVisit.id,
        status: "UNPAID",
        total: 35000,
        items: {
          create: [
            { name: "Konsultasi Dokter", qty: 1, price: 25000, subtotal: 25000 },
            { name: "Paracetamol 500mg", qty: 5, price: 2000, subtotal: 10000 }
          ]
        }
      }
    });
  }

  const existingInvoice2 = await prisma.billingInvoice.findFirst({ where: { visitId: seedVisit2.id } });
  if (!existingInvoice2) {
    await prisma.billingInvoice.upsert({
      where: { number: "INV-SEED-0002" },
      update: {
        visitId: seedVisit2.id,
        status: "PAID",
        total: 252500
      },
      create: {
        number: "INV-SEED-0002",
        visitId: seedVisit2.id,
        status: "PAID",
        total: 252500,
        items: {
          create: [
            { name: "Konsultasi Dokter Umum", qty: 1, price: 50000, subtotal: 50000 },
            { name: "Paracetamol 500mg", qty: 15, price: 1500, subtotal: 22500 },
            { name: "Amoxicillin 500mg", qty: 15, price: 3500, subtotal: 52500 },
            { name: "Pemeriksaan Darah Lengkap", qty: 1, price: 127500, subtotal: 127500 }
          ]
        }
      }
    });
  }

  const existingPortalInvoice = await prisma.billingInvoice.findFirst({ where: { visitId: patientPortalVisit.id } });
  if (!existingPortalInvoice) {
    await prisma.billingInvoice.create({
      data: {
        number: "INV-SEED-PORTAL-0001",
        visitId: patientPortalVisit.id,
        status: "UNPAID",
        total: 70000,
        items: {
          create: [
            { name: "Konsultasi Kontrol", qty: 1, price: 50000, subtotal: 50000 },
            { name: "Obat Lanjutan", qty: 1, price: 20000, subtotal: 20000 }
          ]
        }
      }
    });
  }
}

main()
  .then(async () => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

