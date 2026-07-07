/**
 * @file inject-file-documentation.ts
 * @description Menyuntikkan header dokumentasi @file ke seluruh sumber TypeScript/TSX SIMRS.
 * @usage pnpm exec tsx scripts/inject-file-documentation.ts
 */

import { readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

const ROOT = join(import.meta.dirname ?? __dirname, "..");

const MODULE_DOCS: Record<string, string> = {
  auth: "Autentikasi JWT, sesi Redis, MFA TOTP, login staff/pasien, registrasi, dan profil.",
  patients: "Manajemen pasien: MRN, data sensitif terenkripsi, blind index, CRUD.",
  appointments: "Janji temu: penjadwalan, status lifecycle, booking pasien mandiri.",
  queues: "Antrian poli: nomor antrian, prioritas, status panggilan.",
  visits: "Kunjungan klinis: registrasi kunjungan, diagnosis, hubungan ke rekam medis.",
  "medical-records": "Rekam medis elektronik: SOAP, diagnosis ICD, finalisasi, kerahasiaan.",
  prescriptions: "Resep obat: item resep, status dispensing farmasi.",
  medicines: "Master obat: inventori, stok, dan katalog farmasi.",
  laboratory: "Laboratorium: order tes, hasil, verifikasi analis.",
  radiology: "Radiologi: order pemeriksaan, upload hasil, verifikasi.",
  billing: "Billing & pembayaran: invoice, tagihan kunjungan, metode bayar.",
  doctors: "Data dokter: spesialisasi, jadwal, lisensi, profil terhubung user.",
  departments: "Departemen/poli rumah sakit per institusi.",
  hospitals: "Data rumah sakit: profil institusi, pengaturan RS.",
  users: "Manajemen pengguna staff: CRUD user, assignment role & departemen.",
  roles: "Role RBAC: definisi peran dan assignment permission.",
  permissions: "Permission RBAC: daftar hak akses granular per modul.",
  "audit-logs": "Audit trail: pencatatan aksi pengguna untuk compliance.",
  "system-logs": "System log: log operasional aplikasi dan error backend.",
  "system-settings": "Pengaturan sistem: maintenance mode, konfigurasi publik.",
  backup: "Backup & restore database PostgreSQL terenkripsi.",
  health: "Health check: status Postgres, Redis, MinIO, metrik sistem.",
  reports: "Laporan operasional: ringkasan harian order RS.",
  files: "Upload/download file ke MinIO (hasil lab, radiologi, lampiran).",
  notifications: "Notifikasi in-app untuk pengguna.",
  captcha: "CAPTCHA native untuk proteksi form publik.",
  encryption: "Layanan enkripsi/dekripsi field sensitif (AES, blind index).",
  prisma: "Koneksi Prisma ORM ke PostgreSQL.",
  redis: "Koneksi Redis untuk cache dan sesi.",
  storage: "Integrasi MinIO object storage.",
  context: "Request context: hospital/department scope per request."
};

const FRONTEND_ROUTE_DOCS: Record<string, string> = {
  login: "Halaman login staff (admin, dokter, perawat, dll.).",
  "patient-login": "Halaman login khusus akun pasien.",
  signup: "Registrasi self-service pasien baru.",
  maintenance: "Halaman maintenance mode saat sistem ditangguhkan.",
  portal: "Portal pasien (legacy, redirect ke /patient).",
  patient: "Dashboard pasien: ringkasan akun dan navigasi layanan.",
  "patient/appointments": "Pasien: lihat dan buat janji temu.",
  "patient/medical-records": "Pasien: riwayat kunjungan dan rekam medis.",
  "patient/billing": "Pasien: tagihan dan status pembayaran.",
  "patient/lab-results": "Pasien: hasil laboratorium terverifikasi.",
  "patient/profile": "Pasien: profil dan data akun.",
  "system-admin": "Dashboard Admin Sistem: ringkasan platform.",
  "system-admin/settings": "Admin Sistem: konfigurasi global & maintenance.",
  "system-admin/backup": "Admin Sistem: backup dan restore database.",
  "system-admin/health": "Admin Sistem: status layanan infrastruktur.",
  "system-admin/users": "Admin Sistem: manajemen pengguna platform.",
  "hospital-admin": "Dashboard Admin RS: ringkasan operasional.",
  "hospital-admin/staff": "Admin RS: kelola staff dan role.",
  "hospital-admin/departments": "Admin RS: kelola departemen/poli.",
  "hospital-admin/settings": "Admin RS: pengaturan institusi.",
  "hospital-admin/reports/daily": "Admin RS: laporan harian order.",
  doctor: "Dashboard dokter: ringkasan jadwal dan pasien.",
  "doctor/schedule": "Dokter: jadwal praktik dan appointment.",
  "doctor/patients": "Dokter: daftar pasien yang ditangani.",
  "doctor/history": "Dokter: riwayat kunjungan.",
  staff: "Dashboard staff operasional (perawat, kasir, dll.).",
  "staff/queue": "Staff: manajemen antrian poli.",
  "staff/registration": "Staff: registrasi pasien walk-in.",
  "staff/appointments": "Staff: kelola janji temu.",
  "staff/billing": "Staff kasir: proses tagihan dan pembayaran.",
  "staff/nursing": "Staff perawat: asuhan dan kunjungan.",
  "staff/pharmacy/orders": "Staff farmasi: order resep dan dispensing.",
  "staff/laboratory/orders": "Staff lab: order dan input hasil.",
  "staff/radiology/orders": "Staff radiologi: order dan hasil.",
  dashboard: "Legacy dashboard redirect ke role home.",
  patients: "Legacy: daftar pasien (app shell).",
  doctors: "Legacy: daftar dokter.",
  appointments: "Legacy: manajemen appointment.",
  queues: "Legacy: antrian.",
  medicines: "Legacy: katalog obat.",
  laboratory: "Legacy: modul laboratorium.",
  radiology: "Legacy: modul radiologi.",
  billing: "Legacy: modul billing.",
  admin: "Legacy: admin users & roles.",
  files: "Legacy: manajemen file upload.",
  "admin/activity-log": "Legacy: log aktivitas audit.",
  "admin/backup": "Legacy: backup database."
};

const LIB_DOCS: Record<string, string> = {
  api: "Klien HTTP Axios: base URL dinamis, interceptor JWT, refresh token.",
  "simrs-api": "API client terpusat: wrapper endpoint SIMRS dengan unwrap envelope.",
  "auth-store": "Penyimpanan token JWT access/refresh di localStorage.",
  "auth-session": "Helper sesi: establish/clear auth + invalidate React Query cache.",
  "role-store": "Penyimpanan role user di cookie untuk middleware Next.js.",
  "role-utils": "Utilitas role: deteksi patient/staff/admin.",
  "dashboard-routes": "Routing dashboard: resolve path per role, access control path.",
  types: "Tipe TypeScript frontend: mirror model API dan envelope response.",
  utils: "Utilitas umum: cn() untuk merge class Tailwind.",
  middleware: "Next.js middleware: auth guard, maintenance redirect, role routing.",
  "patients-api": "API client khusus modul pasien.",
  "hospital-admin-api": "API client modul admin rumah sakit.",
  "profile-api": "API client profil pengguna.",
  "backup-api": "API client backup database.",
  "audit-api": "API client audit log.",
  "audit-utils": "Utilitas format dan filter audit log.",
  "audit.types": "Tipe data audit log frontend.",
  "health-api": "API client health check infrastruktur.",
  "system-settings-api": "API client pengaturan sistem.",
  "system-overview-api": "API client ringkasan sistem.",
  "system-logs-api": "API client system log.",
  "captcha-api": "API client CAPTCHA challenge.",
  "password-validator": "Validasi kekuatan password di form frontend."
};

function walk(dir: string, acc: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (["node_modules", ".next", "dist", "coverage"].includes(entry)) continue;
      walk(full, acc);
    } else if (/\.(ts|tsx)$/.test(entry) && !entry.endsWith(".d.ts")) {
      acc.push(full);
    }
  }
  return acc;
}

function getModuleName(relPath: string): string | null {
  const match = relPath.match(/modules\/([^/]+)/);
  return match?.[1] ?? null;
}

function describeBackend(relPath: string, fileName: string): string {
  const mod = getModuleName(relPath);
  const modDesc = mod ? MODULE_DOCS[mod] ?? `Modul ${mod}.` : "";

  if (fileName === "main.ts") {
    return "Entry point backend: bootstrap NestJS, Swagger, helmet, versioning /v1.";
  }
  if (fileName === "app.module.ts") {
    return "Root module NestJS: registrasi semua modul, guard global, interceptor audit.";
  }
  if (fileName === "app.controller.ts") {
    return "Controller root: endpoint health check dasar API.";
  }
  if (relPath.includes("/common/auth/")) {
    const base = basename(fileName, ".ts");
    const map: Record<string, string> = {
      "abac.guard": "Guard ABAC: evaluasi policy hospital/department/doctor-patient.",
      "mac.guard": "Guard MAC: mandatory access control rekam medis sensitif.",
      "jwt-auth.guard": "Guard JWT: validasi bearer token pada request.",
      "permissions.guard": "Guard RBAC: cek permission key pada handler.",
      "permissions.decorator": "Decorator @RequirePermissions untuk endpoint RBAC.",
      "current-user.decorator": "Decorator @CurrentUser untuk inject payload JWT.",
      "policy.engine": "Mesin policy ABAC: hospital_scope, department_scope, dll.",
      "jwt.strategy": "Passport JWT strategy: ekstrak user dari access token.",
      "access-control.module": "Modul global access control: policy engine & guards."
    };
    return map[base] ?? `Komponen access control: ${base}.`;
  }
  if (relPath.includes("/common/http/")) {
    if (fileName.includes("exception")) return "Filter exception global: format error response konsisten.";
    if (fileName.includes("response")) return "Interceptor response: bungkus payload API envelope { success, data }.";
  }
  if (relPath.includes("/common/pagination/")) {
    return "Utilitas paginasi: parse query page/limit dan meta response.";
  }
  if (relPath.includes("/common/validators/")) {
    return "Validator custom class-validator (password kuat, dll.).";
  }
  if (relPath.includes("/common/decorators/")) {
    return "Decorator NestJS custom untuk metadata handler.";
  }
  if (relPath.includes("/config/")) {
    return "Validasi schema environment variable backend (Zod/class-validator).";
  }
  if (relPath.includes("/shared/")) {
    const sharedMod = relPath.split("/shared/")[1]?.split("/")[0];
    return MODULE_DOCS[sharedMod ?? ""] ?? `Infrastruktur shared: ${sharedMod ?? fileName}.`;
  }
  if (fileName.endsWith(".module.ts")) {
    return `Modul NestJS ${mod ?? ""}: wiring dependency injection. ${modDesc}`.trim();
  }
  if (fileName.endsWith(".controller.ts")) {
    return `Controller REST API ${mod ?? ""}: endpoint HTTP. ${modDesc}`.trim();
  }
  if (fileName.endsWith(".service.ts")) {
    return `Service bisnis ${mod ?? ""}: logika domain & Prisma. ${modDesc}`.trim();
  }
  if (relPath.includes("/dto/")) {
    const dtoName = basename(fileName, ".dto.ts");
    return `DTO validasi request ${mod ?? ""}: ${dtoName} (class-validator).`;
  }
  if (fileName.endsWith(".interceptor.ts")) {
    return `Interceptor ${mod ?? ""}: middleware request/response.`;
  }
  if (fileName.endsWith(".guard.ts")) {
    return `Guard ${mod ?? ""}: proteksi route berdasarkan kondisi bisnis.`;
  }
  if (fileName === "index.ts") {
    return `Barrel export modul ${mod ?? dirname(relPath)}.`;
  }
  if (fileName.endsWith(".types.ts") || fileName === "types.ts") {
    return `Definisi tipe TypeScript modul ${mod ?? ""}.`;
  }
  if (fileName.endsWith(".util.ts")) {
    return `Fungsi utilitas modul ${mod ?? ""}.`;
  }
  if (relPath.includes("/test/")) {
    return "Tes otomatis backend.";
  }
  return `Kode backend ${mod ? `modul ${mod}` : relPath}.`;
}

function describeFrontend(relPath: string, fileName: string): string {
  if (fileName === "middleware.ts") {
    return LIB_DOCS.middleware;
  }
  if (relPath.includes("/lib/")) {
    const libName = basename(fileName, ".ts").replace(/\.tsx$/, "");
    return LIB_DOCS[libName] ?? `Library frontend: ${libName}.`;
  }
  if (relPath.includes("/hooks/")) {
    return `React hook: ${basename(fileName, ".tsx")}.`;
  }
  if (relPath.includes("/app/")) {
    const routePart = relPath
      .replace(/^apps\/frontend\/src\/app\//, "")
      .replace(/\/page\.tsx$/, "")
      .replace(/^\(dashboard\)\//, "")
      .replace(/^\(app\)\//, "")
      .replace(/\/layout\.tsx$/, "")
      .replace(/\/page\.tsx$/, "");
    if (fileName === "layout.tsx") {
      return `Layout route /${routePart}: shell navigasi dan auth guard client.`;
    }
    if (fileName === "page.tsx") {
      return FRONTEND_ROUTE_DOCS[routePart] ?? `Halaman route /${routePart}.`;
    }
    if (fileName === "providers.tsx") {
      return "Provider global React: QueryClient, theme, toast.";
    }
    if (fileName === "globals.css") return "Stylesheet global Tailwind dan CSS variables.";
  }
  if (relPath.includes("/components/ui/")) {
    return `Komponen UI shadcn/ui: ${basename(fileName, ".tsx")}.`;
  }
  if (relPath.includes("/components/audit/")) {
    return `Komponen UI audit log: ${basename(fileName, ".tsx")}.`;
  }
  if (relPath.includes("/components/")) {
    const comp = basename(fileName, ".tsx");
    const map: Record<string, string> = {
      "dashboard-shell": "Shell layout dashboard role-based dengan sidebar navigasi.",
      "app-sidebar": "Sidebar navigasi legacy app shell.",
      "login-form": "Form login staff dengan validasi dan redirect role.",
      "patient-login-form": "Form login pasien terpisah dari staff.",
      "maintenance-banner": "Banner peringatan maintenance mode di UI.",
      "dashboard-overview": "Kartu ringkasan statistik dashboard.",
      "page-header": "Header halaman dengan judul dan aksi.",
      "captcha-field": "Field input CAPTCHA pada form publik.",
      "native-captcha": "Widget CAPTCHA native SIMRS.",
      "password-strength-indicator": "Indikator visual kekuatan password.",
      "patient-form": "Form create/edit data pasien.",
      "system-log-table": "Tabel system log dengan filter.",
      "team-switcher": "Switcher tim/departemen di sidebar.",
      "nav-main": "Navigasi utama sidebar.",
      "nav-user": "Menu user profil dan logout.",
      "nav-flat": "Navigasi datar untuk dashboard.",
      "nav-projects": "Navigasi proyek/departemen."
    };
    return map[comp] ?? `Komponen React: ${comp}.`;
  }
  return `Kode frontend: ${relative(join(ROOT, "apps/frontend/src"), join(ROOT, relPath))}.`;
}

function describePackage(relPath: string, fileName: string): string {
  if (relPath.includes("packages/db/prisma/schema.prisma")) {
    return "Skema database Prisma: model, enum, relasi seluruh domain SIMRS.";
  }
  if (fileName === "seed.ts") {
    return "Seed database: role, permission, user demo, data master awal.";
  }
  if (relPath.includes("seeders/")) {
    return `Seeder data: ${basename(fileName, ".ts")}.`;
  }
  if (fileName === "encryption.ts") {
    return "Utilitas enkripsi AES dan blind index untuk field sensitif DB.";
  }
  if (fileName === "prisma.ts" || fileName === "index.ts") {
    return "Ekspor klien Prisma dan helper package @simrs/db.";
  }
  if (relPath.includes("shared/src/constants/roles")) {
    return "Konstanta role key yang dibagikan frontend/backend.";
  }
  if (relPath.includes("shared/src/constants/permissions")) {
    return "Konstanta permission key RBAC bersama.";
  }
  if (relPath.includes("shared/src/types/")) {
    return "Tipe API envelope dan DTO bersama monorepo.";
  }
  if (fileName === "query.ts" || fileName === "query-detailed.ts") {
    return "Helper query SQL/Prisma untuk debugging atau laporan.";
  }
  return `Package monorepo: ${relPath}.`;
}

function describeFile(absPath: string): string {
  const relPath = relative(ROOT, absPath).replace(/\\/g, "/");
  const fileName = basename(absPath);

  if (relPath.startsWith("apps/backend/")) return describeBackend(relPath, fileName);
  if (relPath.startsWith("apps/frontend/")) return describeFrontend(relPath, fileName);
  if (relPath.startsWith("packages/")) return describePackage(relPath, fileName);
  if (relPath.startsWith("scripts/")) return `Script operasional: ${fileName}.`;
  return `Sumber SIMRS: ${relPath}.`;
}

function buildHeader(absPath: string): string {
  const relPath = relative(ROOT, absPath).replace(/\\/g, "/");
  const description = describeFile(absPath);
  return `/**
 * @file ${basename(absPath)}
 * @path ${relPath}
 * @description ${description}
 * @see docs/CODEBASE.md — dokumentasi arsitektur lengkap SIMRS
 */`;
}

function injectHeader(content: string, header: string): string {
  if (/@file\s/.test(content)) return content;

  const useClient = content.match(/^["']use client["'];?\s*\n/);
  if (useClient) {
    const rest = content.slice(useClient[0].length).replace(/^\s*\n/, "");
    return `${useClient[0]}\n${header}\n\n${rest}`;
  }
  return `${header}\n\n${content}`;
}

function main() {
  const targets = [
    join(ROOT, "apps/backend/src"),
    join(ROOT, "apps/frontend/src"),
    join(ROOT, "packages"),
    join(ROOT, "scripts")
  ];

  let updated = 0;
  let skipped = 0;

  for (const dir of targets) {
    for (const file of walk(dir)) {
      const original = readFileSync(file, "utf8");
      if (/@file\s/.test(original)) {
        skipped += 1;
        continue;
      }
      const next = injectHeader(original, buildHeader(file));
      if (next !== original) {
        writeFileSync(file, next, "utf8");
        updated += 1;
      }
    }
  }

  console.log(`Documentation injected: ${updated} files updated, ${skipped} already documented.`);
}

main();
