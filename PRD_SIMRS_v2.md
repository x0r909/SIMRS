# 📋 Product Requirements Document (PRD)

## SIMRS — Sistem Informasi Manajemen Rumah Sakit

### All-in-One Monorepo v2.0

---

> **Dokumen ini bersifat living document.**  
> Repository: [https://github.com/x0r909/SIMRS](https://github.com/x0r909/SIMRS)   
> Versi PRD: 2.0.0   
> Tanggal: 10 Juni 2026   
> Status: Implementasi - Review Fitur

## Daftar Isi

1. [Ringkasan Eksekutif](#1-ringkasan-eksekutif)
2. [Latar Belakang & Tujuan](#2-latar-belakang--tujuan)
3. [Ruang Lingkup](#3-ruang-lingkup)
4. [Pemangku Kepentingan (Stakeholders)](#4-pemangku-kepentingan-stakeholders)
5. [Arsitektur Sistem](#5-arsitektur-sistem)
6. [Pemisahan Dashboard per Peran](#6-pemisahan-dashboard-per-peran)
7. [Manajemen Akses & Access Control](#7-manajemen-akses--access-control)
8. [Sistem Logging & Audit](#8-sistem-logging--audit)
9. [Health Check & Monitoring](#9-health-check--monitoring)
10. [UI/UX Responsif](#10-uiux-responsif)
11. [Backup & Restore Data](#11-backup--restore-data)
12. [Enkripsi Data Sensitif](#12-enkripsi-data-sensitif)
13. [Fitur Klinis & Operasional Lengkap](#13-fitur-klinis--operasional-lengkap)
14. [Skema Database (Prisma)](#14-skema-database-prisma)
15. [Spesifikasi API Endpoint](#15-spesifikasi-api-endpoint)
16. [Keamanan Sistem (Security)](#16-keamanan-sistem-security)
17. [Persyaratan Non-Fungsional](#17-persyaratan-non-fungsional)
18. [Deployment & DevOps](#18-deployment--devops)
19. [Acceptance Criteria](#19-acceptance-criteria)
20. [Roadmap & Milestone](#20-roadmap--milestone)
21. [Risiko & Mitigasi](#21-risiko--mitigasi)
22. [Glossary](#22-glossary)

---

## 1. Ringkasan Eksekutif

SIMRS (Sistem Informasi Manajemen Rumah Sakit) adalah platform digital terintegrasi berbasis web yang dirancang untuk mendigitalisasi seluruh proses operasional rumah sakit — mulai dari registrasi pasien, antrian, rekam medis elektronik, farmasi, laboratorium, radiologi, hingga penagihan dan keuangan — dalam satu ekosistem monorepo yang kohesif dan aman.

Versi 2.0 ini berfokus pada penguatan **keamanan**, **pemisahan konteks dashboard per peran**, **audit trail lengkap**, **enkripsi data sensitif**, **backup/restore**, dan **UI/UX yang sepenuhnya responsif** — menjadikan SIMRS siap untuk digunakan di lingkungan produksi rumah sakit skala menengah ke atas.

**Stack Teknologi:**


| Layer            | Teknologi                                                    |
| ---------------- | ------------------------------------------------------------ |
| Frontend         | Next.js 15 (App Router), TypeScript, Tailwind CSS, shadcn/ui |
| Backend API      | NestJS 11, TypeScript, Fastify adapter                       |
| ORM & Database   | Prisma 6 + PostgreSQL 16                                     |
| Cache & Session  | Redis 7                                                      |
| Object Storage   | MinIO (S3-compatible)                                        |
| Monorepo Tooling | pnpm Workspace + Turborepo                                   |
| Containerisasi   | Docker + Docker Compose                                      |


---

## 2. Latar Belakang & Tujuan

### 2.1 Latar Belakang

Sistem SIMRS versi 1.x telah berhasil membangun fondasi monorepo dengan modul autentikasi, RBAC dasar, manajemen pasien, antrian, farmasi, laboratorium, radiologi, dan billing. Namun terdapat beberapa kesenjangan signifikan yang perlu diatasi:

- **Dashboard tidak terpisah per peran** — semua pengguna melihat UI yang sama dengan fitur tersembunyi berdasarkan permission, bukan tampilan yang benar-benar berbeda.
- **Access Control masih lemah** — RBAC sudah ada tetapi belum ada Mandatory Access Control (MAC) dan validasi permission belum konsisten di seluruh endpoint.
- **Logging belum enterprise-grade** — log audit ada tetapi belum ada server logging terpusat, tidak ada real-time alerting, dan tidak tersedia di dashboard Admin Sistem secara penuh.
- **Health check minimal** — belum ada endpoint monitoring standar yang bisa diintegrasikan dengan tools seperti Prometheus atau Uptime Kuma.
- **UI/UX tidak mobile-first** — beberapa halaman tidak optimal di layar kecil.
- **Tidak ada mekanisme backup/restore** yang terkelola dari dashboard.
- **Data sensitif tidak terenkripsi di level database** — NIK, nomor rekam medis, dan data keuangan tersimpan plain text.

### 2.2 Tujuan Proyek v2.0

1. Membangun **lima dashboard terpisah** yang disesuaikan dengan kebutuhan setiap peran.
2. Mengimplementasikan **Access Control berlapis** (RBAC + ABAC + MAC).
3. Membangun **server logging terpusat** dengan dashboard real-time untuk Admin Sistem.
4. Menyediakan **health check endpoint** standar industri.
5. Mendesain ulang UI agar **mobile-first dan fully responsive**.
6. Membangun fitur **backup & restore** yang aman dan terjadwal.
7. Mengenkripsi **semua data PII dan data medis sensitif** di database.

### 2.3 Tujuan Bisnis

- Meningkatkan efisiensi operasional rumah sakit minimal 30%.
- Memenuhi standar keamanan data pasien sesuai regulasi PERMENKES No. 24 Tahun 2022 dan PDPA Indonesia.
- Mengurangi kesalahan pencatatan manual hingga 90%.
- Menyediakan laporan real-time untuk manajemen rumah sakit.

---

## 3. Ruang Lingkup

### 3.1 Dalam Lingkup (In Scope)

- Pemisahan dashboard untuk 5 peran: Admin Sistem, Admin Rumah Sakit, Dokter, Staff Rumah Sakit, Pasien.
- Refactor Access Control: RBAC (sudah ada), ABAC, dan Mandatory Access Control.
- Server logging terpusat dengan dashboard Admin Sistem (log aplikasi, log akses, log error, log audit).
- Health check endpoint `/v1/health` dan `/v1/health/detailed`.
- Redesign UI/UX responsif (mobile, tablet, desktop).
- Fitur backup & restore database (hanya Admin Sistem).
- Enkripsi field sensitif di database (AES-256-GCM via Prisma middleware).
- Modul klinis lengkap: Rekam Medis, Farmasi, Laboratorium, Radiologi, Billing.
- Notifikasi in-app dan email untuk event penting.
- Multi-tenancy dasar (satu instalasi bisa mengelola beberapa unit/departemen).

### 3.2 Di Luar Lingkup (Out of Scope)

- Aplikasi mobile native (Android/iOS) — hanya PWA/responsive web.
- Integrasi dengan BPJS Kesehatan API (direncanakan v3.0).
- Modul HR & Penggajian penuh (hanya manajemen user dasar).
- Modul akuntansi lengkap.
- Video konsultasi telemedicine.

---

## 4. Pemangku Kepentingan (Stakeholders)


| Peran                 | Deskripsi                                                     | Kebutuhan Utama                                              |
| --------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| **Admin Sistem**      | Super admin teknis, bisa satu orang atau tim IT               | Kontrol penuh sistem, monitoring, backup, log server         |
| **Admin Rumah Sakit** | Manajer operasional RS, bisa per unit                         | Konfigurasi RS, laporan operasional, manajemen user internal |
| **Dokter**            | Tenaga medis                                                  | Rekam medis pasien, riwayat kunjungan, resep digital         |
| **Staff Rumah Sakit** | Perawat, kasir, resepsionis, apoteker, radiologis, analis lab | Modul sesuai tugas masing-masing                             |
| **Pasien**            | Pengguna layanan kesehatan                                    | Riwayat kunjungan, hasil lab, tagihan, antrian               |


---

## 5. Arsitektur Sistem

### 5.1 Struktur Monorepo

```
SIMRS/
├── apps/
│   ├── backend/                   NestJS API Server
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── auth/          JWT + OAuth + MFA
│   │       │   ├── users/         User management
│   │       │   ├── roles/         RBAC roles & permissions
│   │       │   ├── patients/      Manajemen pasien
│   │       │   ├── doctors/       Manajemen dokter
│   │       │   ├── appointments/  Jadwal & antrian
│   │       │   ├── medical-records/ Rekam medis elektronik
│   │       │   ├── pharmacy/      Farmasi & obat
│   │       │   ├── laboratory/    Lab order & hasil
│   │       │   ├── radiology/     Radiologi order & hasil
│   │       │   ├── billing/       Tagihan & pembayaran
│   │       │   ├── audit-logs/    Audit trail
│   │       │   ├── system-logs/   [BARU] Server log terpusat
│   │       │   ├── health/        [BARU] Health check
│   │       │   ├── backup/        [BARU] Backup & restore
│   │       │   ├── encryption/    [BARU] Encryption service
│   │       │   └── notifications/ Notifikasi
│   │       ├── guards/
│   │       │   ├── jwt.guard.ts
│   │       │   ├── roles.guard.ts
│   │       │   ├── permissions.guard.ts
│   │       │   ├── abac.guard.ts   [BARU]
│   │       │   └── mac.guard.ts    [BARU]
│   │       ├── interceptors/
│   │       │   ├── logging.interceptor.ts
│   │       │   └── encryption.interceptor.ts [BARU]
│   │       ├── middleware/
│   │       │   ├── audit-logging.middleware.ts
│   │       │   └── rate-limit.middleware.ts
│   │       └── common/
│   │           ├── decorators/
│   │           ├── dto/
│   │           └── filters/
│   │
│   └── frontend/                  Next.js App Router
│       └── src/
│           ├── app/
│           │   ├── (auth)/        Login, register, forgot password
│           │   ├── (dashboard)/
│           │   │   ├── system-admin/    [BARU] Dashboard Admin Sistem
│           │   │   ├── hospital-admin/  [BARU] Dashboard Admin RS
│           │   │   ├── doctor/          [BARU] Dashboard Dokter
│           │   │   ├── staff/           [BARU] Dashboard Staff
│           │   │   └── patient/         [BARU] Dashboard Pasien
│           │   └── layout.tsx
│           ├── components/
│           │   ├── ui/            shadcn/ui components
│           │   ├── shared/        Shared components
│           │   ├── audit/         Audit log components
│           │   └── charts/        Chart components
│           ├── hooks/
│           ├── lib/
│           │   ├── api/
│           │   ├── auth/
│           │   └── utils/
│           └── middleware.ts      Next.js middleware (auth routing)
│
└── packages/
    ├── db/                        Prisma schema & migrations
    │   └── prisma/
    │       ├── schema.prisma
    │       ├── migrations/
    │       └── seeders/
    ├── shared/                    [BARU] Shared types & constants
    │   └── src/
    │       ├── types/
    │       ├── constants/
    │       └── validators/
    ├── eslint-config/
    └── tsconfig/
```

### 5.2 Diagram Arsitektur

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ Browser  │  │ Mobile   │  │ Tablet   │  │ Desktop App  │   │
│  │ (Web)    │  │ (PWA)    │  │ (PWA)    │  │ (PWA)        │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
└───────┼─────────────┼──────────────┼────────────────┼───────────┘
        │              │              │                │
        └──────────────┴──────────────┴────────────────┘
                                │ HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      NEXT.JS FRONTEND                             │
│   Next.js 15 App Router | SSR/SSG/ISR | Tailwind | shadcn/ui   │
│   ┌───────────┐ ┌──────────┐ ┌────────┐ ┌───────┐ ┌────────┐  │
│   │Sys Admin  │ │Hosp Admin│ │Doctor  │ │Staff  │ │Patient │  │
│   │Dashboard  │ │Dashboard │ │Dash    │ │Dash   │ │Portal  │  │
│   └───────────┘ └──────────┘ └────────┘ └───────┘ └────────┘  │
└─────────────────────────────────────────────────────────────────┘
                                │ REST API / HTTP
┌─────────────────────────────────────────────────────────────────┐
│                      NESTJS BACKEND                               │
│   NestJS 11 | Fastify | Guards | Interceptors | Pipes           │
│   ┌────────┐ ┌────────┐ ┌──────┐ ┌────────┐ ┌──────────────┐  │
│   │Auth    │ │Medical │ │Admin │ │Logging │ │Health/Backup │  │
│   │Module  │ │Modules │ │Mods  │ │Module  │ │Modules       │  │
│   └────────┘ └────────┘ └──────┘ └────────┘ └──────────────┘  │
└───────────────────┬──────────────────────────┬──────────────────┘
                    │                            │
        ┌───────────┴────────────┐   ┌───────────┴────────────┐
        │   DATA LAYER           │   │   CACHE & STORAGE       │
        │  ┌──────────────────┐  │   │  ┌──────┐ ┌─────────┐  │
        │  │  PostgreSQL 16   │  │   │  │Redis │ │  MinIO  │  │
        │  │  (Prisma ORM)    │  │   │  │  7   │ │(S3-comp)│  │
        │  │  + Encryption    │  │   │  └──────┘ └─────────┘  │
        │  └──────────────────┘  │   └────────────────────────┘
        └────────────────────────┘
```

### 5.3 Infrastruktur Docker

```yaml
# docker-compose.yml (target state v2.0)
services:
  postgres:      PostgreSQL 16 (utama)
  redis:         Redis 7 (cache + session + queue)
  minio:         MinIO (object storage)
  backend:       NestJS API
  frontend:      Next.js
  pgadmin:       DB Admin UI (dev only)
  prometheus:    [BARU] Metrics collection
  grafana:       [BARU] Metrics dashboard
  loki:          [BARU] Log aggregation
  promtail:      [BARU] Log shipper
```

---

## 6. Pemisahan Dashboard per Peran

### 6.1 Prinsip Pemisahan

Setiap peran memiliki **route group terpisah** di Next.js App Router (`/system-admin`, `/hospital-admin`, `/doctor`, `/staff`, `/patient`). Routing dilakukan oleh `middleware.ts` berdasarkan peran aktif dari JWT token. Pengguna dengan lebih dari satu peran dapat switch context.

### 6.2 Dashboard Admin Sistem (`/system-admin`)

Akses: **SYSTEM_ADMIN** saja. Tidak ada hospital-bound context.

**Widget & Halaman:**


| Halaman                     | Deskripsi                                                                      |
| --------------------------- | ------------------------------------------------------------------------------ |
| `/system-admin`             | Overview: jumlah RS, total user, uptime sistem, error rate 24 jam              |
| `/system-admin/hospitals`   | CRUD rumah sakit terdaftar, status aktif/nonaktif                              |
| `/system-admin/users`       | Daftar semua user lintas RS, reset password, force logout                      |
| `/system-admin/roles`       | Kelola role global dan permission matrix                                       |
| `/system-admin/logs/system` | **Server log real-time** (stdout/stderr backend, level: error/warn/info/debug) |
| `/system-admin/logs/audit`  | Audit trail lengkap semua aksi di semua RS                                     |
| `/system-admin/logs/access` | Log akses HTTP (IP, endpoint, response code, latency)                          |
| `/system-admin/health`      | Dashboard health check semua service (DB, Redis, MinIO, API)                   |
| `/system-admin/backup`      | **Buat, jadwalkan, download, restore** backup database & storage               |
| `/system-admin/settings`    | Konfigurasi global: enkripsi key rotation, rate limit, session timeout         |
| `/system-admin/security`    | Daftar IP blocklist, failed login alerts, aktif sessions                       |


**Komponen Khusus:**

- Real-time log viewer (WebSocket/SSE) dengan filter level dan search.
- Grafik uptime, error rate, response time (integrasi Prometheus/Grafana embed).
- Backup scheduler dengan cron expression editor.
- Health status grid dengan auto-refresh 30 detik.

### 6.3 Dashboard Admin Rumah Sakit (`/hospital-admin`)

Akses: **HOSPITAL_ADMIN** — dibatasi hanya pada data rumah sakit yang dimiliki (hospital-scoped).

**Widget & Halaman:**


| Halaman                           | Deskripsi                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `/hospital-admin`                 | Overview: jumlah pasien hari ini, antrian aktif, pendapatan hari ini, dokter aktif |
| `/hospital-admin/staff`           | CRUD user staff dalam RS (dokter, perawat, kasir, apoteker, dll.)                  |
| `/hospital-admin/departments`     | Manajemen departemen/poli                                                          |
| `/hospital-admin/schedules`       | Jadwal dokter & poli                                                               |
| `/hospital-admin/reports/daily`   | Laporan harian (kunjungan, pendapatan, diagnosa terbanyak)                         |
| `/hospital-admin/reports/monthly` | Laporan bulanan dengan grafik tren                                                 |
| `/hospital-admin/inventory`       | Ringkasan stok obat & alkes                                                        |
| `/hospital-admin/audit-logs`      | Audit log terbatas untuk RS sendiri                                                |
| `/hospital-admin/settings`        | Pengaturan RS: nama, logo, jam operasional, kepala RS                              |
| `/hospital-admin/billing-config`  | Konfigurasi tarif, jenis pembayaran, BPJS (future)                                 |


### 6.4 Dashboard Dokter (`/doctor`)

Akses: **DOCTOR** — dibatasi pada pasien yang pernah/sedang ditangani.

**Widget & Halaman:**


| Halaman                                 | Deskripsi                                                 |
| --------------------------------------- | --------------------------------------------------------- |
| `/doctor`                               | Daftar pasien hari ini, antrian aktif, reminder jadwal    |
| `/doctor/patients`                      | Daftar pasien (riwayat & aktif)                           |
| `/doctor/patients/:id`                  | Profil pasien + rekam medis elektronik lengkap            |
| `/doctor/patients/:id/soap`             | Input SOAP note (Subjective, Objective, Assessment, Plan) |
| `/doctor/patients/:id/prescriptions`    | Buat resep digital                                        |
| `/doctor/patients/:id/lab-orders`       | Order pemeriksaan lab                                     |
| `/doctor/patients/:id/radiology-orders` | Order pemeriksaan radiologi                               |
| `/doctor/schedule`                      | Jadwal praktek dan manajemen antrian                      |
| `/doctor/history`                       | Riwayat semua pasien yang pernah ditangani                |


**Fitur Khusus Dokter:**

- Quick SOAP template per jenis penyakit.
- Drug interaction checker saat menulis resep.
- Akses ke hasil lab/radiologi secara langsung (link dari order).
- Tanda tangan digital elektronik untuk rekam medis.

### 6.5 Dashboard Staff Rumah Sakit (`/staff`)

Akses: Staff memiliki sub-peran (NURSE, CASHIER, PHARMACIST, RADIOLOGIST, LAB_ANALYST, RECEPTIONIST). Dashboard disesuaikan berdasarkan sub-peran, tetapi route utama sama.

**Widget & Halaman per Sub-peran:**

**Resepsionis:**


| Halaman               | Deskripsi                     |
| --------------------- | ----------------------------- |
| `/staff/registration` | Registrasi pasien baru & lama |
| `/staff/queue`        | Manajemen antrian poli aktif  |
| `/staff/appointments` | Pembuatan & perubahan jadwal  |


**Perawat:**


| Halaman                | Deskripsi                                     |
| ---------------------- | --------------------------------------------- |
| `/staff/nursing`       | Triase, vital sign input, catatan keperawatan |
| `/staff/queue/nursing` | Antrian pasien di nursing station             |


**Kasir:**


| Halaman                       | Deskripsi                                |
| ----------------------------- | ---------------------------------------- |
| `/staff/billing`              | Daftar tagihan pending                   |
| `/staff/billing/:id/payment`  | Proses pembayaran (cash, transfer, QRIS) |
| `/staff/billing/daily-report` | Rekap harian kasir                       |


**Apoteker:**


| Halaman                      | Deskripsi                         |
| ---------------------------- | --------------------------------- |
| `/staff/pharmacy/orders`     | Daftar resep yang perlu disiapkan |
| `/staff/pharmacy/inventory`  | Stok obat & alkes                 |
| `/staff/pharmacy/dispensing` | Proses penyerahan obat            |


**Analis Laboratorium:**


| Halaman                     | Deskripsi                    |
| --------------------------- | ---------------------------- |
| `/staff/laboratory/orders`  | Order lab masuk              |
| `/staff/laboratory/results` | Input & verifikasi hasil lab |


**Radiologis:**


| Halaman                    | Deskripsi                      |
| -------------------------- | ------------------------------ |
| `/staff/radiology/orders`  | Order radiologi masuk          |
| `/staff/radiology/results` | Upload & input hasil radiologi |


### 6.6 Dashboard Pasien (Portal Pasien) (`/patient`)

Akses: **PATIENT** — hanya bisa melihat data milik sendiri.

**Widget & Halaman:**


| Halaman                    | Deskripsi                                                       |
| -------------------------- | --------------------------------------------------------------- |
| `/patient`                 | Overview: kunjungan berikutnya, tagihan outstanding, notifikasi |
| `/patient/profile`         | Edit profil & data kontak                                       |
| `/patient/appointments`    | Lihat & buat janji (jika fitur online booking aktif)            |
| `/patient/queue`           | Nomor antrian aktif & estimasi waktu                            |
| `/patient/medical-records` | Riwayat kunjungan & diagnosa (read-only)                        |
| `/patient/lab-results`     | Hasil pemeriksaan laboratorium                                  |
| `/patient/prescriptions`   | Riwayat resep                                                   |
| `/patient/billing`         | Tagihan & riwayat pembayaran                                    |
| `/patient/documents`       | Download dokumen (surat rujukan, surat sakit)                   |


---

## 7. Manajemen Akses & Access Control

### 7.1 Model Access Control Berlapis

SIMRS v2.0 mengimplementasikan tiga lapisan access control yang bekerja secara berurutan:

```
Request masuk
    │
    ▼
[Layer 1: Authentication]
    JWT Guard — verifikasi token valid, tidak expired, tidak di-blacklist
    │
    ▼
[Layer 2: RBAC — Role-Based Access Control]
    Roles Guard — apakah role user punya akses ke resource ini?
    │
    ▼
[Layer 3: ABAC — Attribute-Based Access Control]
    ABAC Guard — apakah atribut user & resource memenuhi policy?
    (contoh: dokter hanya bisa akses pasien di RS-nya)
    │
    ▼
[Layer 4: MAC — Mandatory Access Control]
    MAC Guard — apakah data memiliki label "confidential" yang
    membutuhkan permission eksplisit tambahan?
    │
    ▼
    Handler Endpoint
```

### 7.2 Definisi Peran & Permission

#### Tabel Peran


| Role Key         | Nama              | Scope    | Deskripsi                         |
| ---------------- | ----------------- | -------- | --------------------------------- |
| `SYSTEM_ADMIN`   | Admin Sistem      | Global   | Super admin teknis seluruh sistem |
| `HOSPITAL_ADMIN` | Admin Rumah Sakit | Hospital | Manajer operasional RS            |
| `DOCTOR`         | Dokter            | Hospital | Tenaga medis                      |
| `NURSE`          | Perawat           | Hospital | Tenaga keperawatan                |
| `CASHIER`        | Kasir             | Hospital | Pemroses pembayaran               |
| `PHARMACIST`     | Apoteker          | Hospital | Pengelola farmasi                 |
| `RADIOLOGIST`    | Radiologis        | Hospital | Spesialis radiologi               |
| `LAB_ANALYST`    | Analis Lab        | Hospital | Analis laboratorium               |
| `RECEPTIONIST`   | Resepsionis       | Hospital | Front desk & registrasi           |
| `PATIENT`        | Pasien            | Self     | Portal pasien                     |


#### Matrix Permission

```
Permission Format: {modul}.{aksi}

Contoh:
  patients.read           — baca data pasien
  patients.write          — buat/edit pasien
  patients.delete         — hapus pasien
  medical-records.read    — baca rekam medis
  medical-records.write   — tulis rekam medis
  billing.read            — baca tagihan
  billing.write           — buat/edit tagihan
  billing.approve         — approve tagihan
  pharmacy.read
  pharmacy.write
  pharmacy.dispense       — keluarkan obat
  laboratory.read
  laboratory.write
  laboratory.verify       — verifikasi hasil lab
  radiology.read
  radiology.write
  radiology.verify
  audit.read              — baca log audit
  audit.export            — export log audit
  backup.create           — buat backup
  backup.restore          — restore backup (CRITICAL)
  system.config           — ubah konfigurasi sistem
  users.read
  users.write
  users.delete
  reports.read
  reports.export
```

#### Tabel Role-Permission Default


| Permission            | SYS_ADMIN | HOSP_ADMIN | DOCTOR | NURSE | CASHIER | PHARMACIST | RADIOLOGIST | LAB_ANALYST | RECEPTIONIST | PATIENT |
| --------------------- | --------- | ---------- | ------ | ----- | ------- | ---------- | ----------- | ----------- | ------------ | ------- |
| patients.read         | ✅         | ✅          | ✅*     | ✅*    | ✅       | ✅          | ✅           | ✅           | ✅            | 🔒self  |
| patients.write        | ✅         | ✅          | ❌      | ❌     | ❌       | ❌          | ❌           | ❌           | ✅            | ❌       |
| medical-records.read  | ✅         | ✅          | ✅*     | ✅*    | ❌       | ✅          | ✅           | ✅           | ❌            | 🔒self  |
| medical-records.write | ✅         | ❌          | ✅*     | ✅*    | ❌       | ❌          | ❌           | ❌           | ❌            | ❌       |
| billing.read          | ✅         | ✅          | ❌      | ❌     | ✅       | ❌          | ❌           | ❌           | ❌            | 🔒self  |
| billing.write         | ✅         | ✅          | ❌      | ❌     | ✅       | ❌          | ❌           | ❌           | ❌            | ❌       |
| pharmacy.dispense     | ✅         | ❌          | ❌      | ❌     | ❌       | ✅          | ❌           | ❌           | ❌            | ❌       |
| laboratory.verify     | ✅         | ❌          | ❌      | ❌     | ❌       | ❌          | ❌           | ✅           | ❌            | ❌       |
| radiology.verify      | ✅         | ❌          | ❌      | ❌     | ❌       | ❌          | ✅           | ❌           | ❌            | ❌       |
| audit.read            | ✅         | ✅**        | ❌      | ❌     | ❌       | ❌          | ❌           | ❌           | ❌            | ❌       |
| backup.create         | ✅         | ❌          | ❌      | ❌     | ❌       | ❌          | ❌           | ❌           | ❌            | ❌       |
| backup.restore        | ✅         | ❌          | ❌      | ❌     | ❌       | ❌          | ❌           | ❌           | ❌            | ❌       |
| system.config         | ✅         | ❌          | ❌      | ❌     | ❌       | ❌          | ❌           | ❌           | ❌            | ❌       |


> `*` = dibatasi oleh ABAC (hanya pasien yang ditangani/di RS yang sama)
> `*`* = dibatasi hanya audit log RS sendiri
> `🔒self` = hanya bisa akses data sendiri

### 7.3 ABAC — Attribute-Based Access Control

ABAC diterapkan menggunakan **policy engine** berbasis aturan yang mengevaluasi:

- `subject.hospitalId === resource.hospitalId` — untuk resource yang hospital-scoped.
- `subject.userId === resource.assignedDoctorId` — dokter hanya bisa edit rekam medis yang dia buat/assign.
- `resource.status !== 'LOCKED'` — rekam medis yang sudah final tidak bisa diedit.
- `subject.shift === 'ACTIVE'` — optional: hanya staff yang sedang bertugas bisa akses.

**Implementasi:**

```typescript
// apps/backend/src/guards/abac.guard.ts
@Injectable()
export class AbacGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const resource = request.resource; // di-inject oleh decorator @LoadResource()

    const policy = this.policyService.getPolicy(
      user.roles,
      request.method,
      request.route
    );

    return this.policyEngine.evaluate(policy, {
      subject: user,
      resource,
      environment: { timestamp: new Date(), ip: request.ip }
    });
  }
}
```

### 7.4 MAC — Mandatory Access Control

MAC berlaku untuk data dengan label kerahasiaan tinggi:


| Label          | Deskripsi                                  | Contoh                     |
| -------------- | ------------------------------------------ | -------------------------- |
| `PUBLIC`       | Bisa dilihat siapa saja yang authenticated | Informasi jadwal dokter    |
| `INTERNAL`     | Hanya user dalam RS                        | Data antrian, billing umum |
| `CONFIDENTIAL` | Hanya role tertentu                        | Rekam medis, hasil lab     |
| `RESTRICTED`   | Hanya role sangat terbatas + approval      | Rekam medis psikiatri, HIV |


Setiap record di tabel `medical_records`, `lab_results`, dan `diagnoses` memiliki field `confidentiality_level` yang dievaluasi di MAC Guard.

### 7.5 Session & Token Management

- **Access Token**: JWT, expire 15 menit.
- **Refresh Token**: Opaque token tersimpan di Redis, expire 7 hari.
- **Token Blacklist**: Stored di Redis set `blacklist:{jti}`, dicheck setiap request.
- **Concurrent Session Limit**: Max 3 device aktif per user (configurable).
- **Force Logout**: Admin dapat invalidate semua session user dari dashboard.
- **Session Tracking**: Tersimpan di tabel `user_sessions` dengan device info & IP.

---

## 8. Sistem Logging & Audit

### 8.1 Tiga Lapisan Logging

#### Layer 1: Audit Log (Business Events)

Sudah ada di v1.x, akan diperkaya:

- 28+ audit actions.
- Disimpan di tabel `audit_logs` PostgreSQL.
- Dapat dieksport Excel/PDF.

#### Layer 2: Access Log (HTTP Request Log)

Log setiap request HTTP masuk:

```
{timestamp} {method} {path} {statusCode} {responseTime}ms {ip} {userId} {userAgent}
```

Format: structured JSON, dikumpulkan oleh **Promtail** → **Loki**.

#### Layer 3: Application/System Log (NestJS Logger)

Log aplikasi level: `error`, `warn`, `info`, `debug`, `verbose`.
Format: JSON dengan `requestId`, `traceId`, `service`, `context`.

### 8.2 Server Logging Stack

```
NestJS Logger (Pino)
    │
    ├── stdout/stderr → Docker log driver
    │       │
    │       └── Promtail (log collector)
    │               │
    │               └── Loki (log aggregation)
    │                       │
    │                       └── Grafana (visualisasi)
    │
    ├── PostgreSQL → audit_logs table (business events)
    │
    └── Redis → real-time log stream (untuk dashboard Admin Sistem)
```

### 8.3 Dashboard Logging Admin Sistem

Endpoint: `/system-admin/logs/system`

**Fitur:**

- **Real-time stream** via Server-Sent Events (SSE) endpoint `/v1/system-logs/stream`.
- Filter: level (error/warn/info/debug), service, waktu.
- Pencarian full-text dalam log.
- **Alert otomatis**: jika error rate > threshold dalam 5 menit, kirim notifikasi ke Admin Sistem via email/in-app.
- Statistik: error count per jam, p95 response time, slow queries.

### 8.4 Skema Database Logging

```prisma
model SystemLog {
  id          String      @id @default(cuid())
  level       LogLevel    // ERROR | WARN | INFO | DEBUG
  service     String      // 'backend' | 'frontend' | 'db' | 'redis'
  context     String?     // 'AuthModule' | 'PatientController' dll.
  message     String
  metadata    Json?
  requestId   String?
  traceId     String?
  ip          String?
  userId      String?
  duration    Int?        // ms
  statusCode  Int?
  createdAt   DateTime    @default(now())

  @@index([level])
  @@index([service])
  @@index([createdAt])
  @@index([requestId])
}

model AuditLog {
  id           String        @id @default(cuid())
  action       AuditAction
  module       AuditModule
  status       AuditStatus
  entity       String
  entityId     String?
  description  String?
  metadata     Json?
  ipAddress    String?
  userAgent    String?
  hospitalId   String?
  createdAt    DateTime      @default(now())

  actorId      String?
  actor        User?         @relation(fields: [actorId], references: [id])
  hospital     Hospital?     @relation(fields: [hospitalId], references: [id])

  @@index([createdAt])
  @@index([actorId])
  @@index([action])
  @@index([module])
  @@index([hospitalId])
}
```

### 8.5 Retention Policy


| Log Type        | Retention | Storage                            |
| --------------- | --------- | ---------------------------------- |
| System Log (DB) | 90 hari   | PostgreSQL + auto-archive ke MinIO |
| Audit Log       | 5 tahun   | PostgreSQL (mandatory regulasi)    |
| Access Log      | 30 hari   | Loki                               |
| Backup Metadata | Permanent | PostgreSQL                         |


---

## 9. Health Check & Monitoring

### 9.1 Endpoint Health Check

#### Basic Health Check

```
GET /v1/health
```

Response (200 OK — Sehat):

```json
{
  "status": "ok",
  "timestamp": "2026-06-10T08:00:00.000Z",
  "uptime": 86400,
  "version": "2.0.0",
  "environment": "production"
}
```

Response (503 Service Unavailable — Ada masalah):

```json
{
  "status": "error",
  "timestamp": "2026-06-10T08:00:00.000Z",
  "error": "Database connection failed"
}
```

#### Detailed Health Check

```
GET /v1/health/detailed
Authorization: Bearer {token} (hanya SYSTEM_ADMIN)
```

Response:

```json
{
  "status": "ok",
  "timestamp": "2026-06-10T08:00:00.000Z",
  "uptime": 86400,
  "version": "2.0.0",
  "services": {
    "database": {
      "status": "ok",
      "responseTime": 12,
      "connections": { "active": 8, "max": 100 }
    },
    "redis": {
      "status": "ok",
      "responseTime": 1,
      "memoryUsage": "45.2 MB",
      "connectedClients": 12
    },
    "minio": {
      "status": "ok",
      "responseTime": 8,
      "buckets": ["medical-records", "lab-results", "backups"]
    }
  },
  "metrics": {
    "requestsPerMinute": 240,
    "errorRateLast5m": 0.002,
    "p95ResponseTime": 145,
    "activeUsers": 34
  }
}
```

#### Readiness & Liveness (untuk Kubernetes)

```
GET /v1/health/ready    — apakah app siap menerima traffic?
GET /v1/health/live     — apakah app masih hidup?
```

### 9.2 Metrics Endpoint (Prometheus)

```
GET /metrics
```

Menyediakan metrics format Prometheus untuk:

- `http_requests_total` — total HTTP requests per method/path/status.
- `http_request_duration_seconds` — histogram response time.
- `active_users_total` — jumlah user aktif.
- `db_query_duration_seconds` — durasi query database.
- `queue_depth` — panjang antrian pasien aktif.
- `backup_last_success_timestamp` — timestamp backup terakhir berhasil.

### 9.3 Dashboard Health (Admin Sistem)

Halaman `/system-admin/health` menampilkan:

- Status card setiap service (hijau/kuning/merah).
- Uptime percentage 30 hari.
- Grafik response time 24 jam.
- Alert aktif.
- Auto-refresh setiap 30 detik.

---

## 10. UI/UX Responsif

### 10.1 Prinsip Desain

- **Mobile-First**: desain dimulai dari viewport 320px, kemudian diperluas ke tablet dan desktop.
- **Progressive Disclosure**: tampilkan informasi yang relevan, sembunyikan yang tidak perlu.
- **Consistency**: menggunakan design system shadcn/ui + Tailwind CSS secara konsisten.
- **Aksesibilitas**: memenuhi standar WCAG 2.1 Level AA.
- **Dark Mode**: dukungan penuh dark/light mode via Tailwind `dark:` variant.

### 10.2 Breakpoint


| Nama  | Lebar           | Target Perangkat          |
| ----- | --------------- | ------------------------- |
| `xs`  | < 480px         | HP kecil                  |
| `sm`  | 480px – 768px   | HP besar / HP landscape   |
| `md`  | 768px – 1024px  | Tablet portrait           |
| `lg`  | 1024px – 1280px | Tablet landscape / laptop |
| `xl`  | 1280px – 1536px | Desktop                   |
| `2xl` | > 1536px        | Large desktop / TV        |


### 10.3 Layout per Perangkat

```
Desktop (>= lg):
┌─────────────────────────────────────────────────────┐
│ Sidebar (220px, fixed) │  Main Content (full width)  │
│  - Logo                │  - Header (breadcrumb)       │
│  - Nav items           │  - Page content              │
│  - User profile        │  - (Charts, tables, forms)   │
└─────────────────────────────────────────────────────┘

Tablet (md):
┌────────────────────────────────────┐
│ Sidebar (collapsed, icons only)    │
├────────────────────────────────────┤
│ Main Content                       │
└────────────────────────────────────┘

Mobile (< md):
┌────────────────────────────────────┐
│ Header + Hamburger menu            │
├────────────────────────────────────┤
│ Main Content (full screen)         │
├────────────────────────────────────┤
│ Bottom Navigation Bar (5 items)    │
└────────────────────────────────────┘
```

### 10.4 Komponen Responsif Kritis

- **DataTable**: pada mobile, kolom tidak penting disembunyikan; ada "expand row" untuk melihat detail.
- **Form**: single-column di mobile, multi-column di desktop.
- **Modal/Dialog**: full-screen di mobile, centered dialog di desktop.
- **Chart**: auto-resize dengan container queries.
- **Sidebar**: collapsible di tablet, drawer/overlay di mobile.

### 10.5 Progressive Web App (PWA)

- Service Worker untuk caching asset statis.
- Manifest untuk "Add to Home Screen".
- Offline fallback page.
- Push notification untuk alert antrian dan hasil lab (web push).

---

## 11. Backup & Restore Data

### 11.1 Prinsip Backup

- **Hanya Admin Sistem** yang bisa memicu backup manual maupun terjadwal.
- Backup tersimpan terenkripsi di MinIO bucket `backups/`.
- Setiap backup memiliki metadata: timestamp, size, hash SHA-256, status, created_by.
- Backup lama dihapus otomatis sesuai retention policy.

### 11.2 Jenis Backup


| Jenis                     | Frekuensi Default      | Deskripsi                                         |
| ------------------------- | ---------------------- | ------------------------------------------------- |
| **Full Backup**           | Harian (jam 02:00 WIB) | Seluruh database PostgreSQL (pg_dump)             |
| **Incremental Backup**    | Setiap 6 jam           | WAL streaming (jika PostgreSQL replication aktif) |
| **Object Storage Backup** | Mingguan               | Sinkronisasi MinIO bucket ke cold storage         |
| **Manual Backup**         | On-demand              | Dipicu Admin Sistem dari dashboard                |


### 11.3 Proses Backup

```
Admin Sistem klik "Buat Backup"
        │
        ▼
Backend: POST /v1/backup/create
        │
        ▼
Job masuk ke Redis Bull Queue (backup.queue)
        │
        ▼
Worker: jalankan pg_dump dengan --no-password, --format=custom
        │
        ▼
Kompres output dengan gzip
        │
        ▼
Enkripsi file dengan AES-256-GCM (key dari env BACKUP_ENCRYPTION_KEY)
        │
        ▼
Upload ke MinIO: backups/full/{timestamp}_{hash}.dump.gz.enc
        │
        ▼
Simpan metadata ke tabel backup_records (PostgreSQL)
        │
        ▼
Kirim notifikasi ke Admin Sistem (email + in-app)
```

### 11.4 Proses Restore

```
Admin Sistem pilih backup dari daftar → klik "Restore"
        │
        ▼
Backend: POST /v1/backup/:id/restore
        │
        ▼
Konfirmasi: Admin harus input MFA code + ketik "CONFIRM_RESTORE"
        │
        ▼
Sistem otomatis masuk "Maintenance Mode" (semua request ditolak)
        │
        ▼
Download file dari MinIO, verifikasi hash SHA-256
        │
        ▼
Dekripsi file
        │
        ▼
Stop koneksi aktif ke PostgreSQL
        │
        ▼
Jalankan pg_restore --clean --if-exists
        │
        ▼
Jalankan migrasi yang mungkin belum applied
        │
        ▼
Verifikasi integritas: row count check
        │
        ▼
Sistem keluar dari "Maintenance Mode"
        │
        ▼
Audit log: RESTORE sukses/gagal
```

### 11.5 Skema Database Backup

```prisma
model BackupRecord {
  id            String        @id @default(cuid())
  type          BackupType    // FULL | INCREMENTAL | MANUAL
  status        BackupStatus  // PENDING | IN_PROGRESS | COMPLETED | FAILED
  fileName      String
  filePath      String        // path di MinIO
  fileSize      BigInt        // bytes
  checksum      String        // SHA-256 hash
  encryptedWith String        // key identifier (bukan key-nya!)
  startedAt     DateTime
  completedAt   DateTime?
  failedAt      DateTime?
  errorMessage  String?
  retentionDays Int           @default(30)
  deletedAt     DateTime?

  createdById   String
  createdBy     User          @relation(fields: [createdById], references: [id])

  restoreLogs   RestoreLog[]

  @@index([status])
  @@index([createdAt])
}

model RestoreLog {
  id            String        @id @default(cuid())
  backupId      String
  backup        BackupRecord  @relation(fields: [backupId], references: [id])
  status        RestoreStatus // PENDING | IN_PROGRESS | COMPLETED | FAILED
  startedAt     DateTime
  completedAt   DateTime?
  errorMessage  String?

  performedById String
  performedBy   User          @relation(fields: [performedById], references: [id])
}
```

### 11.6 Retention Policy Backup


| Jenis           | Retain                 | Delete Setelah     |
| --------------- | ---------------------- | ------------------ |
| Backup harian   | 7 backup terakhir      | 7 hari             |
| Backup mingguan | 4 backup terakhir      | 30 hari            |
| Backup bulanan  | 12 backup terakhir     | 365 hari           |
| Backup manual   | Tidak dihapus otomatis | Admin hapus manual |


---

## 12. Enkripsi Data Sensitif

### 12.1 Pendekatan Enkripsi

SIMRS menggunakan **enkripsi di level aplikasi** (application-layer encryption) via **Prisma Client Extension** + **NestJS Encryption Service** menggunakan **AES-256-GCM**.

> ⚠️ TDE (Transparent Data Encryption) di PostgreSQL memerlukan PostgreSQL Enterprise. Pendekatan ini kompatibel dengan PostgreSQL Community Edition.

### 12.2 Field yang Dienkripsi


| Tabel             | Field                                            | Alasan                    |
| ----------------- | ------------------------------------------------ | ------------------------- |
| `patients`        | `nik`, `medicalRecordNumber`, `phone`, `address` | PII — data identitas      |
| `patients`        | `dateOfBirth`                                    | PII                       |
| `medical_records` | `chiefComplaint`, `diagnosis`, `notes`           | Data medis sensitif       |
| `medical_records` | `anamnesis`, `physicalExamination`               | Data medis sensitif       |
| `diagnoses`       | `description`, `notes`                           | Data medis sensitif       |
| `prescriptions`   | `notes`                                          | Data medis                |
| `lab_results`     | `notes`, `interpretasi`                          | Data lab sensitif         |
| `billing_items`   | `amount`                                         | Data keuangan             |
| `users`           | `phone`, `nationalId`                            | PII staff                 |
| `audit_logs`      | `metadata`                                       | Bisa berisi data sensitif |


### 12.3 Implementasi Enkripsi

```typescript
// packages/db/src/encryption.ts

import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

export function encrypt(plaintext: string, key: Buffer): string {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Format: iv:authTag:encrypted
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decrypt(ciphertext: string, key: Buffer): string {
  const [ivHex, authTagHex, encrypted] = ciphertext.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = createDecipheriv(ALGORITHM, key, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}
```

```typescript
// Prisma Client Extension untuk enkripsi otomatis
export const encryptionExtension = Prisma.defineExtension((client) => {
  return client.$extends({
    query: {
      patient: {
        async create({ args, query }) {
          args.data = encryptPatientFields(args.data);
          return query(args);
        },
        async findFirst({ args, query }) {
          const result = await query(args);
          return result ? decryptPatientFields(result) : result;
        },
        // ... update, findMany, dll.
      },
    },
  });
});
```

### 12.4 Manajemen Kunci Enkripsi

- **Kunci Enkripsi** disimpan di environment variable `ENCRYPTION_KEY` (base64 32 bytes).
- **Key Rotation**: Admin Sistem dapat merotasi kunci melalui dashboard. Proses: dekripsi semua data dengan kunci lama → enkripsi ulang dengan kunci baru → ganti `ENCRYPTION_KEY`.
- **Kunci Backup** tersimpan terpisah di `BACKUP_ENCRYPTION_KEY`.
- **Key Derivation**: gunakan `PBKDF2` dengan salt per-record untuk enkripsi yang lebih kuat (opsional untuk data very sensitive).

### 12.5 Pencarian pada Field Terenkripsi

Karena field terenkripsi tidak bisa di-query langsung, gunakan strategi:

- **Deterministic Encryption** untuk field yang perlu di-search exact (NIK, nomor rekam medis) — gunakan HMAC-SHA256 sebagai blind index.
- **Full-text search** pada field terenkripsi tidak didukung langsung; gunakan Elasticsearch atau implementasi search di aplikasi.

```prisma
model Patient {
  // ...
  nikEncrypted      String   // Hasil AES-256-GCM
  nikBlindIndex     String   // HMAC-SHA256(NIK, searchKey) — untuk search
  // ...
  @@index([nikBlindIndex])
}
```

---

## 13. Fitur Klinis & Operasional Lengkap

### 13.1 Modul Registrasi & Pendaftaran

- Registrasi pasien baru dengan validasi NIK.
- Registrasi pasien lama (search by nama/NIK/nomor RM).
- Pembuatan nomor rekam medis otomatis (format configurable: `{RS_CODE}-{TAHUN}-{SEQUENCE}`).
- Pendaftaran ke poli dengan pilihan dokter dan slot waktu.
- Cetak nomor antrian (atau kirim via SMS/WhatsApp).

### 13.2 Modul Antrian

- Manajemen antrian real-time per poli.
- Tampilan nomor antrian untuk layar display di ruang tunggu.
- Prioritas antrian: Normal, Lansia, Disabilitas, Darurat.
- Notifikasi push ke pasien ketika nomor mendekati giliran.
- Statistik rata-rata waktu tunggu per poli.

### 13.3 Modul Rekam Medis Elektronik (EMR)

- SOAP Note (Subjective, Objective, Assessment, Plan).
- Input vital sign (TD, nadi, suhu, SpO2, BB, TB, IMT).
- ICD-10 diagnosis picker dengan search.
- Riwayat alergi dan penyakit kronis.
- Tanda tangan digital dokter (canvas signature).
- Lampiran file (hasil lab, foto luka, dll.) via MinIO.
- Rekam medis terkunci setelah dokter "finalize" (tidak bisa diedit, hanya bisa addendum).

### 13.4 Modul Farmasi & Apotek

- Resep digital dari dokter → queue di apotek.
- Stok obat dengan alert minimum stock.
- Barcode/QR code obat.
- Pencatatan pengeluaran obat (FIFO/FEFO).
- Riwayat penggunaan obat pasien.
- Drug interaction checker (opsional: integrasi API eksternal).
- Laporan konsumsi obat bulanan.

### 13.5 Modul Laboratorium

- Order pemeriksaan lab dari dokter.
- Queue analis lab.
- Input hasil per parameter (nilai, satuan, nilai normal, interpretasi).
- Upload file hasil (PDF, gambar).
- Verifikasi hasil oleh analis senior.
- Notifikasi ke dokter ketika hasil tersedia.
- Template panel pemeriksaan (darah lengkap, urine rutin, dll.).

### 13.6 Modul Radiologi

- Order radiologi dari dokter.
- Queue radiologis.
- Upload gambar/file DICOM (via MinIO).
- Input expertise/interpretasi.
- Verifikasi hasil.
- Notifikasi ke dokter.

### 13.7 Modul Billing & Pembayaran

- Generasi tagihan otomatis dari tindakan, obat, lab, radiologi.
- Penambahan item manual.
- Diskon dan penyesuaian.
- Multi-metode pembayaran: Cash, Transfer, Kartu Debit/Kredit, QRIS.
- Integrasi payment gateway (opsional: Midtrans/Xendit).
- Cetak kwitansi dan invoice.
- Tagihan tertunda dan cicilan.
- Laporan pendapatan harian/bulanan.

---

## 14. Skema Database (Prisma)

### 14.1 Model Utama

```prisma
// packages/db/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

// ─────────────────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────────────────

enum UserStatus    { ACTIVE INACTIVE SUSPENDED PENDING_VERIFICATION }
enum HospitalStatus { ACTIVE INACTIVE }
enum Gender        { MALE FEMALE OTHER }
enum BloodType     { A_POS A_NEG B_POS B_NEG AB_POS AB_NEG O_POS O_NEG }
enum QueueStatus   { WAITING CALLED IN_PROGRESS DONE SKIP CANCEL }
enum QueuePriority { NORMAL ELDERLY DISABLED EMERGENCY }
enum VisitStatus   { REGISTERED WAITING IN_PROGRESS DONE CANCELLED }
enum MedicalRecordStatus { DRAFT IN_PROGRESS FINAL ARCHIVED }
enum ConfidentialityLevel { PUBLIC INTERNAL CONFIDENTIAL RESTRICTED }
enum LabOrderStatus { PENDING IN_PROGRESS COMPLETED CANCELLED }
enum LabResultStatus { PENDING VERIFIED APPROVED }
enum RadiologyOrderStatus { PENDING IN_PROGRESS COMPLETED CANCELLED }
enum PrescriptionStatus { PENDING DISPENSED CANCELLED }
enum BillingStatus { DRAFT PENDING PARTIAL PAID CANCELLED }
enum PaymentMethod { CASH TRANSFER CREDIT_CARD DEBIT_CARD QRIS BPJS INSURANCE }
enum BackupType    { FULL INCREMENTAL MANUAL }
enum BackupStatus  { PENDING IN_PROGRESS COMPLETED FAILED }
enum LogLevel      { ERROR WARN INFO DEBUG VERBOSE }
enum AuditAction   { LOGIN LOGOUT LOGIN_FAILED RESET_PASSWORD CHANGE_PASSWORD USER_CREATE USER_UPDATE USER_DELETE ROLE_CHANGE PATIENT_REGISTER PATIENT_CREATE PATIENT_UPDATE PATIENT_DELETE DIAGNOSIS_ADD MEDICAL_RECORD_UPDATE PRESCRIPTION_ADD LAB_RESULT_UPLOAD APPOINTMENT_BOOK APPOINTMENT_RESCHEDULE APPOINTMENT_CANCEL MEDICINE_STOCK_ADD MEDICINE_STOCK_UPDATE MEDICINE_OUT DATABASE_BACKUP DATABASE_RESTORE SYSTEM_ERROR SETTING_UPDATE OTHER }
enum AuditModule   { AUTH USER_MANAGEMENT PATIENT APPOINTMENT MEDICAL_RECORD PHARMACY BILLING RADIOLOGY LABORATORY QUEUE SYSTEM OTHER }
enum AuditStatus   { SUCCESS FAILED ERROR WARNING }

// ─────────────────────────────────────────────────────────
// SYSTEM MODELS
// ─────────────────────────────────────────────────────────

model Hospital {
  id              String          @id @default(cuid())
  code            String          @unique
  name            String
  address         String
  phone           String
  email           String
  logoUrl         String?
  status          HospitalStatus  @default(ACTIVE)
  settings        Json?
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  users           User[]
  patients        Patient[]
  departments     Department[]
  auditLogs       AuditLog[]
  backupRecords   BackupRecord[]
}

model User {
  id                    String          @id @default(cuid())
  email                 String          @unique
  passwordHash          String
  name                  String
  phoneEncrypted        String?         // AES-256-GCM
  nationalIdEncrypted   String?         // AES-256-GCM (NIK)
  nationalIdBlindIndex  String?         // HMAC blind index untuk search
  status                UserStatus      @default(ACTIVE)
  emailVerifiedAt       DateTime?
  lastLoginAt           DateTime?
  failedLoginAttempts   Int             @default(0)
  lockedUntil           DateTime?
  mfaEnabled            Boolean         @default(false)
  mfaSecret             String?
  avatarUrl             String?
  createdAt             DateTime        @default(now())
  updatedAt             DateTime        @updatedAt

  hospitalId            String?
  hospital              Hospital?       @relation(fields: [hospitalId], references: [id])

  roles                 UserRole[]
  sessions              UserSession[]
  auditLogs             AuditLog[]      @relation("AuditActor")
  restoreLogs           RestoreLog[]    @relation("RestorePerformer")
  backupRecords         BackupRecord[]

  patientProfile        Patient?        @relation("UserPatient")
  doctorProfile         Doctor?

  @@index([email])
  @@index([nationalIdBlindIndex])
  @@index([hospitalId])
}

model Role {
  id          String        @id @default(cuid())
  key         String        @unique  // 'SYSTEM_ADMIN', 'DOCTOR', dll.
  name        String
  description String?
  isSystem    Boolean       @default(false)  // system role tidak bisa dihapus
  createdAt   DateTime      @default(now())

  users       UserRole[]
  permissions RolePermission[]
}

model Permission {
  id          String        @id @default(cuid())
  key         String        @unique  // 'patients.read', dll.
  module      String
  action      String
  description String?

  roles       RolePermission[]
}

model UserRole {
  userId      String
  roleId      String
  assignedAt  DateTime    @default(now())
  assignedBy  String?

  user        User        @relation(fields: [userId], references: [id])
  role        Role        @relation(fields: [roleId], references: [id])

  @@id([userId, roleId])
}

model RolePermission {
  roleId        String
  permissionId  String

  role          Role        @relation(fields: [roleId], references: [id])
  permission    Permission  @relation(fields: [permissionId], references: [id])

  @@id([roleId, permissionId])
}

model UserSession {
  id            String    @id @default(cuid())
  userId        String
  refreshToken  String    @unique
  deviceInfo    String?
  ipAddress     String?
  userAgent     String?
  expiresAt     DateTime
  createdAt     DateTime  @default(now())
  revokedAt     DateTime?

  user          User      @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([refreshToken])
}

// ─────────────────────────────────────────────────────────
// CLINICAL MODELS
// ─────────────────────────────────────────────────────────

model Patient {
  id                      String    @id @default(cuid())
  medicalRecordNumber     String    // terenkripsi
  medicalRecordBlindIndex String    // blind index untuk search
  nikEncrypted            String
  nikBlindIndex           String
  name                    String
  gender                  Gender
  dateOfBirthEncrypted    String
  bloodType               BloodType?
  phoneEncrypted          String?
  addressEncrypted        String?
  emergencyContact        String?
  allergies               String[]
  createdAt               DateTime  @default(now())
  updatedAt               DateTime  @updatedAt

  hospitalId              String
  hospital                Hospital  @relation(fields: [hospitalId], references: [id])
  userId                  String?   @unique
  userAccount             User?     @relation("UserPatient", fields: [userId], references: [id])

  visits                  Visit[]
  appointments            Appointment[]
  billings                Billing[]

  @@index([medicalRecordBlindIndex])
  @@index([nikBlindIndex])
  @@index([hospitalId])
}

model Doctor {
  id              String    @id @default(cuid())
  specialization  String
  licenseNumber   String    @unique
  schedule        Json?
  userId          String    @unique
  user            User      @relation(fields: [userId], references: [id])

  appointments    Appointment[]
  visits          Visit[]
}

model Department {
  id          String    @id @default(cuid())
  name        String
  code        String
  hospitalId  String
  hospital    Hospital  @relation(fields: [hospitalId], references: [id])

  @@unique([code, hospitalId])
}

model Appointment {
  id              String      @id @default(cuid())
  scheduledDate   DateTime
  status          VisitStatus @default(REGISTERED)
  notes           String?
  patientId       String
  doctorId        String
  hospitalId      String
  createdAt       DateTime    @default(now())

  patient         Patient     @relation(fields: [patientId], references: [id])
  doctor          Doctor      @relation(fields: [doctorId], references: [id])
  visit           Visit?
}

model Visit {
  id              String              @id @default(cuid())
  visitDate       DateTime            @default(now())
  queueNumber     String
  status          VisitStatus         @default(REGISTERED)
  priority        QueuePriority       @default(NORMAL)

  patientId       String
  doctorId        String
  appointmentId   String?             @unique
  hospitalId      String

  patient         Patient             @relation(fields: [patientId], references: [id])
  doctor          Doctor              @relation(fields: [doctorId], references: [id])
  appointment     Appointment?        @relation(fields: [appointmentId], references: [id])

  medicalRecord   MedicalRecord?
  billing         Billing?
  labOrders       LabOrder[]
  radiologyOrders RadiologyOrder[]
}

model MedicalRecord {
  id                          String                    @id @default(cuid())
  chiefComplaintEncrypted     String
  anamnesisEncrypted          String?
  physicalExaminationEncrypted String?
  diagnosisEncrypted          String?
  planEncrypted               String?
  vitalSigns                  Json
  confidentialityLevel        ConfidentialityLevel      @default(INTERNAL)
  status                      MedicalRecordStatus       @default(DRAFT)
  signedAt                    DateTime?
  signatureData               String?                   // base64 tanda tangan

  visitId                     String                    @unique
  visit                       Visit                     @relation(fields: [visitId], references: [id])

  diagnoses                   Diagnosis[]
  prescriptions               Prescription[]
}

model Diagnosis {
  id              String    @id @default(cuid())
  icdCode         String
  icdDescription  String
  type            String    // MAIN | SECONDARY | COMPLICATION
  notesEncrypted  String?

  medicalRecordId String
  medicalRecord   MedicalRecord @relation(fields: [medicalRecordId], references: [id])
}

model Prescription {
  id              String              @id @default(cuid())
  status          PrescriptionStatus  @default(PENDING)
  notesEncrypted  String?
  dispensedAt     DateTime?

  medicalRecordId String
  medicalRecord   MedicalRecord       @relation(fields: [medicalRecordId], references: [id])

  items           PrescriptionItem[]
}

model PrescriptionItem {
  id              String        @id @default(cuid())
  medicineName    String
  dose            String
  frequency       String
  duration        String
  quantity        Int
  notes           String?

  prescriptionId  String
  prescription    Prescription  @relation(fields: [prescriptionId], references: [id])
}

model LabOrder {
  id          String          @id @default(cuid())
  status      LabOrderStatus  @default(PENDING)
  panel       String
  notes       String?
  createdAt   DateTime        @default(now())

  visitId     String
  visit       Visit           @relation(fields: [visitId], references: [id])

  results     LabResult[]
}

model LabResult {
  id              String            @id @default(cuid())
  status          LabResultStatus   @default(PENDING)
  parameters      Json              // array of {name, value, unit, normalRange, flag}
  notesEncrypted  String?
  fileUrl         String?           // MinIO URL
  verifiedAt      DateTime?
  verifiedById    String?
  createdAt       DateTime          @default(now())

  labOrderId      String
  labOrder        LabOrder          @relation(fields: [labOrderId], references: [id])
}

model RadiologyOrder {
  id              String                  @id @default(cuid())
  examType        String
  status          RadiologyOrderStatus    @default(PENDING)
  notes           String?
  createdAt       DateTime                @default(now())

  visitId         String
  visit           Visit                   @relation(fields: [visitId], references: [id])

  result          RadiologyResult?
}

model RadiologyResult {
  id              String    @id @default(cuid())
  expertise       String?
  imageUrls       String[]  // MinIO URLs
  verifiedAt      DateTime?
  createdAt       DateTime  @default(now())

  orderId         String    @unique
  order           RadiologyOrder @relation(fields: [orderId], references: [id])
}

model Billing {
  id          String          @id @default(cuid())
  totalAmount Decimal         @db.Decimal(12, 2)
  paidAmount  Decimal         @db.Decimal(12, 2)    @default(0)
  status      BillingStatus   @default(DRAFT)
  createdAt   DateTime        @default(now())
  paidAt      DateTime?

  patientId   String
  visitId     String          @unique
  patient     Patient         @relation(fields: [patientId], references: [id])
  visit       Visit           @relation(fields: [visitId], references: [id])

  items       BillingItem[]
  payments    Payment[]
}

model BillingItem {
  id          String    @id @default(cuid())
  category    String
  name        String
  quantity    Int       @default(1)
  unitPrice   Decimal   @db.Decimal(12, 2)
  totalPrice  Decimal   @db.Decimal(12, 2)

  billingId   String
  billing     Billing   @relation(fields: [billingId], references: [id])
}

model Payment {
  id            String        @id @default(cuid())
  amount        Decimal       @db.Decimal(12, 2)
  method        PaymentMethod
  referenceNo   String?
  notes         String?
  paidAt        DateTime      @default(now())

  billingId     String
  billing       Billing       @relation(fields: [billingId], references: [id])
}

// ─────────────────────────────────────────────────────────
// LOGGING & AUDIT MODELS
// ─────────────────────────────────────────────────────────

model AuditLog {
  id              String        @id @default(cuid())
  action          AuditAction
  module          AuditModule
  status          AuditStatus
  entity          String
  entityId        String?
  description     String?
  metadataEncrypted Json?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime      @default(now())

  actorId         String?
  actor           User?         @relation("AuditActor", fields: [actorId], references: [id])
  hospitalId      String?
  hospital        Hospital?     @relation(fields: [hospitalId], references: [id])

  @@index([createdAt])
  @@index([actorId])
  @@index([action])
  @@index([module])
  @@index([hospitalId])
}

model SystemLog {
  id          String    @id @default(cuid())
  level       LogLevel
  service     String
  context     String?
  message     String
  metadata    Json?
  requestId   String?
  traceId     String?
  ipAddress   String?
  userId      String?
  duration    Int?
  statusCode  Int?
  createdAt   DateTime  @default(now())

  @@index([level])
  @@index([service])
  @@index([createdAt])
}

// ─────────────────────────────────────────────────────────
// BACKUP MODELS
// ─────────────────────────────────────────────────────────

model BackupRecord {
  id              String        @id @default(cuid())
  type            BackupType
  status          BackupStatus  @default(PENDING)
  fileName        String
  filePath        String
  fileSize        BigInt?
  checksum        String?
  encryptedWith   String
  retentionDays   Int           @default(30)
  startedAt       DateTime      @default(now())
  completedAt     DateTime?
  failedAt        DateTime?
  errorMessage    String?
  deletedAt       DateTime?

  hospitalId      String?
  hospital        Hospital?     @relation(fields: [hospitalId], references: [id])
  createdById     String
  createdBy       User          @relation(fields: [createdById], references: [id])

  restoreLogs     RestoreLog[]

  @@index([status])
  @@index([createdAt])
}

model RestoreLog {
  id              String    @id @default(cuid())
  status          String
  startedAt       DateTime  @default(now())
  completedAt     DateTime?
  errorMessage    String?

  backupId        String
  backup          BackupRecord @relation(fields: [backupId], references: [id])
  performedById   String
  performedBy     User      @relation("RestorePerformer", fields: [performedById], references: [id])
}
```

---

## 15. Spesifikasi API Endpoint

### 15.1 Konvensi API

- Base URL: `/v1`
- Authentication: `Authorization: Bearer {jwt_access_token}`
- Content-Type: `application/json`
- Error Format: `{ "statusCode": 4xx, "message": "...", "error": "..." }`
- Pagination: `?page=1&limit=20` → `{ "data": [...], "pagination": { "page", "limit", "total", "totalPages" } }`

### 15.2 Auth Module

```
POST   /v1/auth/login              Masuk dengan email & password
POST   /v1/auth/logout             Logout, invalidate refresh token
POST   /v1/auth/refresh            Perbarui access token
POST   /v1/auth/forgot-password    Kirim email reset password
POST   /v1/auth/reset-password     Reset password dengan token
POST   /v1/auth/change-password    Ganti password (authenticated)
POST   /v1/auth/verify-email       Verifikasi email
POST   /v1/auth/enable-mfa         Aktifkan MFA (TOTP)
POST   /v1/auth/verify-mfa         Verifikasi kode MFA
DELETE /v1/auth/sessions/:id       Revoke session tertentu
GET    /v1/auth/sessions           List semua session aktif saya
```

### 15.3 User & Role Management

```
GET    /v1/users                   Daftar user (filter, paginate)
POST   /v1/users                   Buat user baru
GET    /v1/users/:id               Detail user
PATCH  /v1/users/:id               Update user
DELETE /v1/users/:id               Hapus user (soft delete)
POST   /v1/users/:id/roles         Assign role ke user
DELETE /v1/users/:id/roles/:roleId Hapus role dari user
POST   /v1/users/:id/force-logout  Logout paksa semua session user
GET    /v1/roles                   Daftar semua role
POST   /v1/roles                   Buat role baru
GET    /v1/roles/:id/permissions   Permission dari role
PUT    /v1/roles/:id/permissions   Update permission role
```

### 15.4 Patient Module

```
GET    /v1/patients                Daftar pasien (search, paginate)
POST   /v1/patients                Daftarkan pasien baru
GET    /v1/patients/:id            Detail pasien
PATCH  /v1/patients/:id            Update data pasien
GET    /v1/patients/:id/visits     Riwayat kunjungan
GET    /v1/patients/:id/billings   Riwayat tagihan
GET    /v1/patients/search         Search by NIK/nama/nomor RM
```

### 15.5 Medical Records

```
POST   /v1/visits                  Buat kunjungan baru
GET    /v1/visits/:id              Detail kunjungan
PATCH  /v1/visits/:id/status       Update status kunjungan

POST   /v1/medical-records         Buat rekam medis
GET    /v1/medical-records/:id     Detail rekam medis
PATCH  /v1/medical-records/:id     Update rekam medis (hanya DRAFT/IN_PROGRESS)
POST   /v1/medical-records/:id/finalize   Finalize rekam medis (tanda tangan digital)
POST   /v1/medical-records/:id/addendum   Tambah addendum pada rekam medis final

POST   /v1/diagnoses               Tambah diagnosis
GET    /v1/prescriptions           Daftar resep
POST   /v1/prescriptions           Buat resep
PATCH  /v1/prescriptions/:id/dispense  Tandai resep sudah diserahkan
```

### 15.6 Laboratory & Radiology

```
GET    /v1/laboratory/orders                          Daftar order lab
POST   /v1/laboratory/orders                          Buat order lab
GET    /v1/laboratory/orders/:id                      Detail order
PUT    /v1/laboratory/orders/:id/status               Update status
POST   /v1/laboratory/orders/:id/results              Input hasil lab
PATCH  /v1/laboratory/orders/:id/results/verify       Verifikasi hasil
GET    /v1/laboratory/orders/dashboard/summary        Summary untuk dashboard

GET    /v1/radiology/orders                           Daftar order radiologi
POST   /v1/radiology/orders                           Buat order radiologi
GET    /v1/radiology/orders/:id                       Detail
PUT    /v1/radiology/orders/:id/status                Update status
POST   /v1/radiology/orders/:id/results               Upload hasil
```

### 15.7 Billing

```
GET    /v1/billing                 Daftar tagihan
POST   /v1/billing                 Buat tagihan (biasanya otomatis dari visit)
GET    /v1/billing/:id             Detail tagihan
PATCH  /v1/billing/:id             Update tagihan (tambah/edit item)
POST   /v1/billing/:id/payments    Proses pembayaran
GET    /v1/billing/report/daily    Laporan harian
GET    /v1/billing/report/monthly  Laporan bulanan
```

### 15.8 Audit & System Logs

```
GET    /v1/audit-logs              Daftar audit log (filter, paginate)
GET    /v1/audit-logs/stats        Statistik audit log
GET    /v1/audit-logs/export/excel Export Excel
GET    /v1/audit-logs/export/pdf   Export PDF

GET    /v1/system-logs             Daftar system log (SYSTEM_ADMIN only)
GET    /v1/system-logs/stats       Statistik system log
GET    /v1/system-logs/stream      SSE stream real-time log
```

### 15.9 Health Check & Backup

```
GET    /v1/health                  Basic health check (public)
GET    /v1/health/detailed         Detailed health (SYSTEM_ADMIN)
GET    /v1/health/ready            Readiness probe
GET    /v1/health/live             Liveness probe
GET    /metrics                    Prometheus metrics

GET    /v1/backup                  Daftar backup (SYSTEM_ADMIN)
POST   /v1/backup/create           Buat backup manual (SYSTEM_ADMIN)
GET    /v1/backup/:id              Detail backup
POST   /v1/backup/:id/restore      Restore backup (SYSTEM_ADMIN + MFA)
DELETE /v1/backup/:id              Hapus backup
GET    /v1/backup/:id/download     Download file backup
GET    /v1/backup/schedule         Lihat jadwal backup
PUT    /v1/backup/schedule         Update jadwal backup (cron expression)
```

---

## 16. Keamanan Sistem (Security)

### 16.1 Checklist Keamanan


| Kategori                  | Kontrol                                                  | Status Target |
| ------------------------- | -------------------------------------------------------- | ------------- |
| **Autentikasi**           | JWT dengan RS256                                         | ✅ Implement   |
|                           | MFA (TOTP - Google Authenticator)                        | ✅ Implement   |
|                           | Brute force protection (lockout setelah 5x gagal)        | ✅ Implement   |
|                           | Session management (max 3 aktif)                         | ✅ Implement   |
|                           | Token blacklist di Redis                                 | ✅ Implement   |
|                           | Password hashing (bcrypt, cost factor 12)                | ✅ Implement   |
| **Otorisasi**             | RBAC + ABAC + MAC                                        | ✅ Implement   |
|                           | Permission checks di setiap endpoint                     | ✅ Implement   |
|                           | Isolasi data antar RS                                    | ✅ Implement   |
| **Enkripsi**              | HTTPS/TLS 1.3 (in transit)                               | ✅ Implement   |
|                           | AES-256-GCM field-level encryption (at rest)             | ✅ Implement   |
|                           | Enkripsi backup dengan kunci terpisah                    | ✅ Implement   |
| **Input Validation**      | DTO validation dengan class-validator                    | ✅ Implement   |
|                           | SQL Injection prevention (Prisma ORM parameterized)      | ✅ Implement   |
|                           | XSS prevention (sanitize output)                         | ✅ Implement   |
|                           | File upload validation (type, size, virus scan)          | ✅ Implement   |
| **Rate Limiting**         | Global: 100 req/min per IP                               | ✅ Implement   |
|                           | Auth endpoints: 10 req/15min per IP                      | ✅ Implement   |
|                           | Export endpoints: 5 req/min per user                     | ✅ Implement   |
| **HTTP Security Headers** | Helmet.js (HSTS, CSP, X-Frame-Options, dll.)             | ✅ Implement   |
|                           | CORS: whitelist domain                                   | ✅ Implement   |
| **Logging**               | Semua auth event dilog                                   | ✅ Implement   |
|                           | Akses data sensitif dilog                                | ✅ Implement   |
|                           | Log disimpan di tempat terpisah, tidak bisa dihapus user | ✅ Implement   |
| **Dependencies**          | npm audit otomatis di CI/CD                              | ✅ Implement   |
|                           | Dependabot alerts                                        | ✅ Implement   |


### 16.2 Security Headers (Helmet.js)

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'nonce-{dynamic}'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://minio.simrs.local"],
      connectSrc: ["'self'", "wss://simrs.local"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));
```

### 16.3 File Upload Security

- Validasi MIME type (tidak hanya berdasarkan ekstensi).
- Batas ukuran file: 50MB per file, 200MB per request.
- Simpan di MinIO dengan akses presigned URL (bukan direct public URL).
- Presigned URL expire dalam 15 menit.
- Nama file di-random (UUID), bukan nama asli dari user.

### 16.4 Penanganan Incident Keamanan

Admin Sistem menerima notifikasi otomatis untuk:

- Login dari IP asing yang belum pernah digunakan user.
- Lebih dari 10 failed login attempts dalam 5 menit dari satu IP.
- Akses ke endpoint `backup.restore`.
- Perubahan konfigurasi keamanan sistem.
- Deteksi anomali (opsional: rate unusual query patterns).

---

## 17. Persyaratan Non-Fungsional

### 17.1 Performa


| Metrik                          | Target      |
| ------------------------------- | ----------- |
| Response time API (p95)         | < 200ms     |
| Response time halaman web (FCP) | < 1.5 detik |
| Throughput API                  | ≥ 500 req/s |
| Waktu backup full (100MB data)  | < 5 menit   |
| Waktu restore (100MB data)      | < 10 menit  |
| Load time dashboard             | < 2 detik   |


### 17.2 Ketersediaan (Availability)

- Target uptime: **99.9%** (≤ 8.7 jam downtime/tahun).
- Maintenance window: 02:00–04:00 WIB setiap Minggu dini hari.
- Health check interval: setiap 30 detik.
- Automatic restart policy via Docker restart policy atau Kubernetes liveness probe.

### 17.3 Skalabilitas

- Backend NestJS: horizontal scaling-ready (stateless, session di Redis).
- Database: connection pooling via PgBouncer (opsional di produksi).
- Redis: single instance untuk development, Redis Sentinel untuk produksi.
- MinIO: single node untuk development, distributed mode untuk produksi.

### 17.4 Kompatibilitas Browser


| Browser       | Versi Minimum |
| ------------- | ------------- |
| Chrome        | 100+          |
| Firefox       | 100+          |
| Safari        | 15+           |
| Edge          | 100+          |
| Mobile Chrome | 100+          |
| Mobile Safari | 15+           |


### 17.5 Aksesibilitas

- WCAG 2.1 Level AA.
- Semantic HTML5.
- ARIA labels untuk komponen interaktif.
- Keyboard navigation penuh.
- Color contrast ratio ≥ 4.5:1.

---

## 18. Deployment & DevOps

### 18.1 Environment


| Environment  | Deskripsi              | URL                    |
| ------------ | ---------------------- | ---------------------- |
| `local`      | Development lokal      | localhost              |
| `staging`    | Testing pre-production | staging.simrs.internal |
| `production` | Production             | simrs.rs-nama.id       |


### 18.2 Environment Variables

```bash
# ==================== DATABASE ====================
DATABASE_URL="postgresql://simrs:password@postgres:5432/simrs_db"
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=20

# ==================== REDIS ====================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password

# ==================== MINIO ====================
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_ACCESS_KEY=simrs_access_key
MINIO_SECRET_KEY=simrs_secret_key
MINIO_BUCKET_MEDICAL=medical-records
MINIO_BUCKET_BACKUP=backups

# ==================== JWT ====================
JWT_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----...
JWT_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----...
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# ==================== ENCRYPTION ====================
ENCRYPTION_KEY=base64_32_bytes_key_here
ENCRYPTION_SEARCH_KEY=base64_32_bytes_search_key_here
BACKUP_ENCRYPTION_KEY=base64_32_bytes_backup_key_here

# ==================== APP ====================
NODE_ENV=production
PORT=4000
FRONTEND_URL=https://simrs.rs-nama.id
CORS_ORIGINS=https://simrs.rs-nama.id

# ==================== EMAIL ====================
SMTP_HOST=smtp.mailserver.com
SMTP_PORT=587
SMTP_USER=noreply@simrs.id
SMTP_PASS=smtp_password
EMAIL_FROM="SIMRS <noreply@simrs.id>"

# ==================== BACKUP ====================
BACKUP_CRON="0 2 * * *"          # Setiap hari jam 02:00
BACKUP_RETENTION_DAYS=30
PG_DUMP_PATH=/usr/bin/pg_dump

# ==================== MONITORING ====================
PROMETHEUS_METRICS_ENABLED=true
LOG_LEVEL=info
```

### 18.3 CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/main.yml

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  lint:     pnpm lint, pnpm typecheck
  test:     pnpm test (unit + integration)
  build:    pnpm build (turbo)
  security: npm audit, trivy scan (Docker image)
  deploy-staging:   Docker build + push + deploy (develop branch)
  deploy-prod:      Docker build + push + deploy (main branch, manual approval)
```

### 18.4 Docker Compose (Production-like)

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: simrs_db
      POSTGRES_USER: simrs
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U simrs"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: ${MINIO_ACCESS_KEY}
      MINIO_ROOT_PASSWORD: ${MINIO_SECRET_KEY}
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "mc", "ready", "local"]
      interval: 30s

  backend:
    build:
      context: .
      dockerfile: apps/backend/Dockerfile
    depends_on: [postgres, redis, minio]
    environment:
      NODE_ENV: production
    ports:
      - "4000:4000"
    restart: unless-stopped

  frontend:
    build:
      context: .
      dockerfile: apps/frontend/Dockerfile
    environment:
      NODE_ENV: production
    ports:
      - "3000:3000"
    restart: unless-stopped

  # Monitoring stack (opsional untuk self-hosted)
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana

  loki:
    image: grafana/loki:latest

  promtail:
    image: grafana/promtail:latest

volumes:
  postgres_data:
  redis_data:
  minio_data:
  grafana_data:
```

---

## 19. Acceptance Criteria

### 19.1 Dashboard Pemisahan

- [ ] Setiap peran memiliki route group terpisah yang tidak bisa diakses peran lain.
- [ ] Middleware Next.js redirect user ke dashboard yang tepat berdasarkan role setelah login.
- [ ] Admin Sistem tidak memiliki akses ke halaman operasional klinik.
- [ ] Pasien hanya bisa melihat data milik sendiri.

### 19.2 Access Control

- [ ] Setiap endpoint yang memerlukan auth mengembalikan 401 jika tanpa token.
- [ ] Setiap endpoint dengan permission check mengembalikan 403 jika permission tidak ada.
- [ ] ABAC berhasil memblokir dokter mengakses pasien RS lain.
- [ ] MAC berhasil memblokir akses ke data label RESTRICTED tanpa permission khusus.

### 19.3 Logging & Audit

- [ ] Semua aksi POST/PUT/PATCH/DELETE tercatat di audit log.
- [ ] Halaman `/system-admin/logs/system` menampilkan log real-time via SSE.
- [ ] Filter log berfungsi: level, service, tanggal, search.
- [ ] Export audit log ke Excel dan PDF berfungsi dengan filter.

### 19.4 Health Check

- [ ] `GET /v1/health` mengembalikan 200 saat semua service sehat.
- [ ] `GET /v1/health` mengembalikan 503 saat database tidak bisa diakses.
- [ ] `GET /v1/health/detailed` hanya bisa diakses SYSTEM_ADMIN.
- [ ] `GET /metrics` mengembalikan format Prometheus yang valid.

### 19.5 UI/UX Responsif

- [ ] Semua halaman tampil dengan benar di viewport 320px, 768px, dan 1280px.
- [ ] Navigation di mobile menggunakan bottom bar atau drawer.
- [ ] Semua tabel memiliki fallback tampilan di mobile (horizontal scroll atau card view).
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1.

### 19.6 Backup & Restore

- [ ] Hanya SYSTEM_ADMIN yang bisa mengakses halaman dan endpoint backup.
- [ ] Backup manual berhasil membuat file `.dump.gz.enc` di MinIO.
- [ ] Restore memerlukan MFA code + konfirmasi teks "CONFIRM_RESTORE".
- [ ] Sistem masuk maintenance mode selama restore berlangsung.
- [ ] Audit log mencatat setiap aksi backup dan restore.

### 19.7 Enkripsi Data

- [ ] NIK pasien yang tersimpan di database adalah ciphertext (bukan plaintext).
- [ ] Blind index NIK berfungsi untuk pencarian exact match.
- [ ] Data pasien tampil dengan benar setelah didekripsi di backend.
- [ ] Rotasi kunci enkripsi berhasil tanpa kehilangan data.

---

## 20. Roadmap & Milestone

### Phase 1: Foundation & Security (Minggu 1–4)

**Sprint 1 (Minggu 1–2) — Access Control Upgrade**

- [ ] Implementasi ABAC Guard
- [ ] Implementasi MAC Guard
- [ ] Refactor semua endpoint dengan permission check konsisten
- [ ] Implementasi session management (max concurrent sessions)
- [ ] Unit test untuk semua guard

**Sprint 2 (Minggu 3–4) — Enkripsi & Logging**

- [ ] Implementasi Prisma encryption extension
- [ ] Enkripsi semua field sensitif & migrasi data
- [ ] Implementasi blind index untuk field yang perlu di-search
- [ ] Implementasi System Log model & service
- [ ] SSE endpoint untuk real-time log streaming

### Phase 2: Dashboard & UI (Minggu 5–8)

**Sprint 3 (Minggu 5–6) — Dashboard Pemisahan**

- [ ] Refactor routing Next.js ke 5 route group
- [ ] Implementasi middleware routing berdasarkan role
- [ ] Dashboard Admin Sistem
- [ ] Dashboard Admin Rumah Sakit

**Sprint 4 (Minggu 7–8) — Dashboard Klinis & Responsif**

- [ ] Dashboard Dokter
- [ ] Dashboard Staff (semua sub-peran)
- [ ] Dashboard Pasien (portal)
- [ ] Redesign komponen responsif (mobile-first)
- [ ] PWA implementation

### Phase 3: Ops & Monitoring (Minggu 9–12)

**Sprint 5 (Minggu 9–10) — Health Check & Backup**

- [ ] Health check endpoints (basic, detailed, ready, live)
- [ ] Prometheus metrics endpoint
- [ ] Implementasi backup service (pg_dump + enkripsi)
- [ ] Backup scheduler (Bull Queue + cron)
- [ ] Restore service dengan maintenance mode

**Sprint 6 (Minggu 11–12) — Monitoring Stack & Testing**

- [ ] Setup Prometheus + Grafana + Loki + Promtail
- [ ] Dashboard Grafana default untuk SIMRS
- [ ] Integration tests semua modul baru
- [ ] Performance testing & optimization
- [ ] Security audit internal
- [ ] Dokumentasi API (Swagger update)

### Phase 4: Hardening & Launch (Minggu 13–16)

- [ ] User Acceptance Testing (UAT)
- [ ] Bug fixes dari UAT
- [ ] Load testing
- [ ] Dokumentasi deployment production
- [ ] Training untuk Admin Sistem
- [ ] Go-live production

---

## 21. Risiko & Mitigasi


| Risiko                                       | Probabilitas | Dampak | Mitigasi                                                                                |
| -------------------------------------------- | ------------ | ------ | --------------------------------------------------------------------------------------- |
| Data loss saat migrasi enkripsi              | Rendah       | Tinggi | Backup penuh sebelum migrasi, rollback plan, migrasi bertahap                           |
| Performance degradasi karena enkripsi        | Sedang       | Sedang | Profiling, gunakan blind index, cache hasil dekripsi                                    |
| Kunci enkripsi hilang                        | Rendah       | Kritis | Backup kunci di key management system (HashiCorp Vault opsional), prosedur key recovery |
| Restore gagal di production                  | Rendah       | Kritis | Test restore secara berkala di staging, dry-run mode                                    |
| Session Redis down (logout paksa semua user) | Sedang       | Sedang | Redis persistence (RDB + AOF), sentinel/replica                                         |
| MinIO storage penuh (file besar)             | Sedang       | Tinggi | Monitor storage, lifecycle policy, alert di 80% kapasitas                               |
| Breaking change Prisma saat update           | Sedang       | Sedang | Pin versi dependensi, test di staging dulu                                              |
| Brute force attack dari IP asing             | Tinggi       | Sedang | Rate limiting, IP blocklist, fail2ban di level infra                                    |


---

## 22. Glossary


| Istilah         | Definisi                                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| **SIMRS**       | Sistem Informasi Manajemen Rumah Sakit                                               |
| **RBAC**        | Role-Based Access Control — kontrol akses berdasarkan peran                          |
| **ABAC**        | Attribute-Based Access Control — kontrol akses berdasarkan atribut                   |
| **MAC**         | Mandatory Access Control — kontrol akses wajib berdasarkan label kerahasiaan         |
| **EMR**         | Electronic Medical Records — rekam medis elektronik                                  |
| **SOAP**        | Subjective, Objective, Assessment, Plan — format dokumentasi klinis                  |
| **ICD-10**      | International Classification of Diseases, 10th Revision                              |
| **PII**         | Personally Identifiable Information — data yang dapat mengidentifikasi seseorang     |
| **AES-256-GCM** | Advanced Encryption Standard, 256-bit, Galois/Counter Mode                           |
| **HMAC**        | Hash-based Message Authentication Code — digunakan untuk blind index                 |
| **Blind Index** | Hash deterministik dari plaintext untuk memungkinkan pencarian pada data terenkripsi |
| **SSE**         | Server-Sent Events — teknologi untuk streaming data dari server ke client            |
| **PWA**         | Progressive Web App — web app dengan kemampuan mirip native app                      |
| **TOTP**        | Time-based One-Time Password — metode MFA                                            |
| **p95**         | Persentil ke-95 dari distribusi response time                                        |
| **WAL**         | Write-Ahead Log — mekanisme PostgreSQL untuk point-in-time recovery                  |
| **FIFO/FEFO**   | First In First Out / First Expired First Out — metode pengeluaran stok               |


---

## Lampiran A: Struktur Folder Lengkap (Target State)

```
apps/backend/src/
├── app.module.ts
├── main.ts
├── common/
│   ├── decorators/
│   │   ├── permissions.decorator.ts
│   │   ├── roles.decorator.ts
│   │   ├── confidentiality.decorator.ts
│   │   └── load-resource.decorator.ts
│   ├── dto/
│   │   ├── pagination.dto.ts
│   │   └── date-range.dto.ts
│   ├── filters/
│   │   ├── http-exception.filter.ts
│   │   └── prisma-exception.filter.ts
│   └── interceptors/
│       ├── logging.interceptor.ts
│       ├── transform.interceptor.ts
│       └── hospital-scope.interceptor.ts
├── guards/
│   ├── jwt.guard.ts
│   ├── roles.guard.ts
│   ├── permissions.guard.ts
│   ├── abac.guard.ts          [BARU]
│   └── mac.guard.ts           [BARU]
├── middleware/
│   ├── audit-logging.middleware.ts
│   ├── rate-limit.middleware.ts
│   └── request-id.middleware.ts
└── modules/
    ├── auth/
    ├── users/
    ├── roles/
    ├── hospitals/
    ├── patients/
    ├── doctors/
    ├── departments/
    ├── appointments/
    ├── visits/
    ├── medical-records/
    ├── diagnoses/
    ├── prescriptions/
    ├── pharmacy/
    ├── laboratory/
    ├── radiology/
    ├── billing/
    ├── notifications/
    ├── audit-logs/
    ├── system-logs/       [BARU]
    ├── health/            [BARU]
    ├── backup/            [BARU]
    └── encryption/        [BARU]
```

---

## Lampiran B: Daftar Permission Lengkap

```
AUTH
  auth.login, auth.logout, auth.change-password, auth.manage-mfa

USERS
  users.read, users.write, users.delete, users.manage-roles, users.force-logout

HOSPITALS
  hospitals.read, hospitals.write, hospitals.delete

PATIENTS
  patients.read, patients.write, patients.delete, patients.export

APPOINTMENTS
  appointments.read, appointments.write, appointments.cancel

VISITS
  visits.read, visits.write, visits.manage-queue

MEDICAL_RECORDS
  medical-records.read, medical-records.write, medical-records.finalize,
  medical-records.read-restricted (label RESTRICTED)

PHARMACY
  pharmacy.read, pharmacy.write, pharmacy.dispense, pharmacy.inventory

LABORATORY
  laboratory.read, laboratory.write, laboratory.verify

RADIOLOGY
  radiology.read, radiology.write, radiology.verify

BILLING
  billing.read, billing.write, billing.approve, billing.export

REPORTS
  reports.read, reports.export

AUDIT
  audit.read, audit.export

SYSTEM_LOGS
  system-logs.read, system-logs.export

BACKUP
  backup.create, backup.restore, backup.delete, backup.download, backup.schedule

SYSTEM
  system.config, system.maintenance, system.key-rotation
```

---

*Dokumen ini dibuat berdasarkan analisis repository SIMRS ([https://github.com/x0r909/SIMRS](https://github.com/x0r909/SIMRS)) dan requirements yang disampaikan.*

*Versi: 2.0.0 | Tanggal: 10 Juni 2026 | Status: Draft*