# SIMRS v2 — Dokumentasi Codebase

Dokumentasi arsitektur dan fungsionalitas seluruh proyek SIMRS (Sistem Informasi Manajemen Rumah Sakit).

Setiap file sumber TypeScript/TSX memiliki header inline:

```typescript
/**
 * @file nama-file.ts
 * @path path/relatif/dari/root
 * @description ...
 * @see docs/CODEBASE.md
 */
```

Regenerasi header: `pnpm exec tsx scripts/inject-file-documentation.ts`

---

## 1. Gambaran Umum

SIMRS adalah monorepo full-stack untuk operasional rumah sakit:

| Komponen | Package | Port dev | Fungsi |
|----------|---------|----------|--------|
| Backend API | `@simrs/backend` | 4000 | REST API NestJS, Swagger `/docs` |
| Frontend Web | `@simrs/frontend` | 3050 | Next.js 15 App Router, multi-role UI |
| Database | `@simrs/db` | — | Prisma schema, migrasi, seed |
| Shared | `@simrs/shared` | — | Konstanta role/permission, tipe API |

### Alur Data Klinis

```
Pasien → Appointment → Visit → MedicalRecord
                              ├── LaboratoryOrder → LaboratoryResult
                              ├── RadiologyOrder → RadiologyResult
                              ├── Prescription → PrescriptionItem (→ Medicines)
                              └── Billing → BillingInvoice → Payment
```

---

## 2. Backend (`apps/backend/src`)

### 2.1 Entry Point

| File | Fungsi |
|------|--------|
| `main.ts` | Bootstrap NestJS: CORS, helmet, compression, versioning `/v1`, Swagger, global pipes/filters |
| `app.module.ts` | Root module: import 30+ modul, ThrottlerGuard, AbacGuard, MacGuard, audit/system log interceptors |
| `app.controller.ts` | `GET /health` — health check dasar |

### 2.2 Infrastruktur Bersama (`common/`)

#### Auth & Access Control (`common/auth/`)

| File | Fungsi |
|------|--------|
| `jwt-auth.guard.ts` | Validasi Bearer JWT pada route terproteksi |
| `jwt.strategy.ts` | Passport strategy: decode JWT → `request.user` |
| `permissions.guard.ts` | Cek user memiliki permission key yang diminta |
| `permissions.decorator.ts` | `@RequirePermissions('patients.read')` |
| `current-user.decorator.ts` | `@CurrentUser()` inject JWT payload |
| `abac.guard.ts` | Evaluasi policy ABAC per handler |
| `mac.guard.ts` | Mandatory access control rekam medis (confidentiality level) |
| `policy.engine.ts` | Engine policy: `hospital_scope`, `department_scope`, `doctor_patient`, `self_patient` |
| `access-control.module.ts` | Modul global DI untuk guards & policy engine |

#### HTTP (`common/http/`)

| File | Fungsi |
|------|--------|
| `response.interceptor.ts` | Bungkus response `{ success: true, data, meta? }` |
| `global-exception.filter.ts` | Format error `{ success: false, error: { message, code } }` |

#### Lainnya

| Path | Fungsi |
|------|--------|
| `common/pagination/pagination.ts` | Helper `page`, `limit`, `skip`, meta paginasi |
| `common/validators/` | Password kuat, validasi custom |
| `config/env.schema.ts` | Validasi env var wajib saat startup |

### 2.3 Shared Services (`shared/`)

| Modul | Fungsi |
|-------|--------|
| `prisma/` | PrismaClient singleton, lifecycle connect/disconnect |
| `redis/` | Koneksi Redis untuk sesi & cache |
| `storage/` | MinIO client: upload, presigned URL, bucket |
| `encryption/crypto.ts` | AES-256-GCM encrypt/decrypt, blind index HMAC |
| `context/` | Request-scoped hospital/department context |

### 2.4 Modul Domain (`modules/`)

Setiap modul mengikuti pola NestJS: `*.module.ts` → `*.controller.ts` + `*.service.ts` + `dto/`.

#### Auth (`modules/auth/`)

| Endpoint / Fitur | Deskripsi |
|------------------|-----------|
| `POST /auth/login/staff` | Login staff dengan rate limit 5/menit |
| `POST /auth/login/patient` | Login pasien (role PATIENT wajib) |
| `POST /auth/register-patient` | Registrasi pasien self-service + profil Patient |
| `POST /auth/refresh` | Refresh access token via refresh token Redis |
| `POST /auth/logout` | Revoke sesi |
| `GET /auth/me` | Profil user + roles + permissions |
| `PATCH /auth/profile` | Update nama, email, telepon |
| MFA TOTP | `enable-mfa`, `verify-mfa`, `disable-mfa` |

| File kunci | Fungsi |
|------------|--------|
| `auth.service.ts` | Login, lockout brute-force, bcrypt, issue JWT |
| `session.service.ts` | Simpan/revoke refresh token di Redis |
| `mfa.service.ts` | Generate secret TOTP, verifikasi token |
| `auth-role.util.ts` | Validasi portal login staff vs pasien |

#### Patients (`modules/patients/`)

- CRUD pasien dengan enkripsi NIK, telepon, alamat
- Blind index untuk pencarian NIK/MRN tanpa dekripsi penuh
- Scope hospital via ABAC
- Link ke akun User untuk portal pasien

#### Appointments (`modules/appointments/`)

- Penjadwalan janji: pasien, dokter, departemen, hospital
- Status: SCHEDULED → CHECKED_IN → IN_PROGRESS → COMPLETED / CANCELLED
- `create-my-appointment.dto.ts` — pasien buat janji sendiri

#### Queues (`modules/queues/`)

- Antrian harian per departemen
- Nomor urut, prioritas (NORMAL, ELDERLY, DISABLED, EMERGENCY)
- Status: WAITING → CALLED → IN_PROGRESS → DONE

#### Visits (`modules/visits/`)

- Kunjungan klinis aktif
- Hubungkan appointment opsional
- Diagnosis, keluhan, status lifecycle

#### Medical Records (`modules/medical-records/`)

- Rekam medis per visit (1:1)
- Field SOAP terenkripsi, vital signs JSON
- Diagnosis ICD, confidentiality level
- Status DRAFT → FINAL → ARCHIVED
- MAC guard untuk RESTRICTED records

#### Prescriptions & Medicines

| Modul | Fungsi |
|-------|--------|
| `prescriptions` | Resep dari rekam medis, item obat, dispensing |
| `medicines` | Master katalog obat, stok farmasi |

#### Laboratory & Radiology

| Modul | Fungsi |
|-------|--------|
| `laboratory` | Order tes, input hasil, verifikasi analis, upload file |
| `radiology` | Order pemeriksaan, hasil gambar, verifikasi radiolog |

#### Billing (`modules/billing/`)

- Invoice per visit
- Status: DRAFT → PENDING → PARTIAL → PAID
- Metode bayar: CASH, TRANSFER, BPJS, QRIS, INSURANCE, dll.
- `billing-list-query.dto.ts` — filter & paginasi tagihan

#### Master Data

| Modul | Fungsi |
|-------|--------|
| `hospitals` | CRUD rumah sakit |
| `departments` | Poli/departemen per RS |
| `doctors` | Profil dokter, spesialisasi, jadwal JSON |
| `users` | Staff user, assign role & departemen |
| `roles` | Definisi role RBAC |
| `permissions` | Daftar permission granular |

#### Sistem & Operasional

| Modul | Fungsi |
|-------|--------|
| `system-settings` | Maintenance mode (registration/patients/full), settings publik |
| `system-logs` | Log operasional backend (startup, error, request) |
| `audit-logs` | Audit trail aksi pengguna (LOGIN, PATIENT_CREATE, dll.) |
| `backup` | pg_dump terenkripsi, restore, download, jadwal |
| `health` | Health Postgres/Redis/MinIO, system overview metrics |
| `reports` | Laporan harian order RS |
| `files` | Upload ke MinIO, metadata FileObject |
| `notifications` | Notifikasi in-app per user |
| `captcha` | Challenge CAPTCHA untuk form publik |
| `encryption` | Service enkripsi field untuk modul lain |

---

## 3. Frontend (`apps/frontend/src`)

### 3.1 Routing & Auth

| File | Fungsi |
|------|--------|
| `middleware.ts` | Guard route: cek cookie role, redirect login, maintenance mode |
| `lib/auth-store.ts` | localStorage JWT access + refresh token |
| `lib/role-store.ts` | Cookie `simrs_roles` untuk SSR middleware |
| `lib/auth-session.ts` | `establishAuthSession()` / `clearAuthSession()` + invalidate query |
| `lib/dashboard-routes.ts` | `resolveDashboardPath()`, `canAccessPath()` per role |

### 3.2 API Clients (`lib/`)

| File | Fungsi |
|------|--------|
| `api.ts` | Axios instance: base URL LAN-aware, interceptor 401 → refresh |
| `simrs-api.ts` | Semua endpoint API: patients, appointments, billing, auth, dll. |
| `*-api.ts` | Client khusus per domain (audit, backup, health, profile, dll.) |
| `types.ts` | Interface TypeScript mirror response API |

### 3.3 Layout & Route Groups

#### `(dashboard)/` — UI Role-Based (aktif)

| Prefix | Role | Halaman |
|--------|------|---------|
| `/system-admin` | SYSTEM_ADMIN | Settings, backup, health, users |
| `/hospital-admin` | HOSPITAL_ADMIN | Staff, departments, reports, settings |
| `/doctor` | DOCTOR | Schedule, patients, history |
| `/staff` | NURSE, CASHIER, PHARMACIST, dll. | Queue, registration, billing, lab, radiology, pharmacy |
| `/patient` | PATIENT | Appointments, medical records, billing, lab results, profile |

#### `(app)/` — Legacy App Shell

UI generik dengan `AppSidebar` — patients, doctors, appointments, queues, medicines, laboratory, radiology, billing, admin. Middleware redirect `/dashboard` ke role home.

#### Portal (`/portal/*`)

Legacy alias — middleware & layout redirect ke `/patient/*`.

### 3.4 Komponen Utama (`components/`)

| Komponen | Fungsi |
|----------|--------|
| `dashboard-shell.tsx` | Layout sidebar + header untuk dashboard role-based |
| `login-form.tsx` | Form login staff |
| `patient-login-form.tsx` | Form login pasien |
| `maintenance-banner.tsx` | Banner saat maintenance aktif |
| `ui/*` | shadcn/ui primitives (button, table, form, sidebar, dll.) |
| `audit/*` | Tabel, filter, pagination audit log |
| `patients/patient-form.tsx` | Form registrasi/edit pasien |

### 3.5 Halaman Publik

| Route | Fungsi |
|-------|--------|
| `/` | Landing redirect |
| `/login` | Login staff |
| `/patient-login` | Login pasien |
| `/signup` | Registrasi pasien |
| `/maintenance` | Halaman maintenance |

---

## 4. Database (`packages/db`)

### 4.1 Schema (`prisma/schema.prisma`)

**Enums utama:** UserStatus, AppointmentStatus, QueueStatus, VisitStatus, MedicalRecordStatus, LabOrderStatus, BillingStatus, AuditAction, dll.

**Model grup:**

| Grup | Model |
|------|-------|
| Sistem | Hospital, Department, User, Role, Permission, UserSession, Notification |
| Klinis | Patient, Doctor, Appointment, QueueEntry, Visit |
| Rekam Medis | MedicalRecord, Diagnosis, Prescription, PrescriptionItem |
| Penunjang | LaboratoryOrder, LaboratoryResult, RadiologyOrder, RadiologyResult |
| Billing | Billing, BillingInvoice, BillingLineItem, Payment |
| Operasional | AuditLog, SystemLog, BackupRecord, DatabaseBackup, FileObject, SystemSetting |

### 4.2 Seed (`prisma/seed.ts`)

- 50+ permission keys
- 10 role sistem dengan mapping permission
- User demo: admin, hospital-admin, doctor, staff roles, patient
- Password dari env `SEED_DEFAULT_PASSWORD`
- Data master: hospital, departments, doctors, medicines

### 4.3 Migrasi

| Migrasi | Isi |
|---------|-----|
| `20260406120000_init` | Schema awal |
| `20260408103000_add_laboratory_and_radiology` | Lab & radiologi |
| `20260420140000_add_database_backup_table` | Backup |
| `20260513_add_audit_log_enums` | Enum audit |
| `20260608090758_add_auth_security_models` | Auth security |
| `20260610120000_v2_schema` | Schema v2 lengkap |

---

## 5. Shared Package (`packages/shared`)

| File | Fungsi |
|------|--------|
| `constants/roles.ts` | Key role: SYSTEM_ADMIN, DOCTOR, PATIENT, dll. |
| `constants/permissions.ts` | Key permission RBAC |
| `types/api.ts` | `ApiEnvelope<T>`, `Paginated<T>` |

---

## 6. Keamanan

### Lapisan Proteksi

1. **Rate limiting** — ThrottlerGuard (login 5/min, global 100/min)
2. **JWT** — Access token pendek + refresh token di Redis
3. **RBAC** — Permission per endpoint (`@RequirePermissions`)
4. **ABAC** — Scope hospital, department, doctor-patient, self-patient
5. **MAC** — Confidentiality level rekam medis
6. **Enkripsi** — Field PHI (NIK, telepon, catatan medis) AES + blind index
7. **Audit** — Interceptor log semua aksi sensitif
8. **Brute-force** — Lockout setelah failed login attempts
9. **MFA** — TOTP opsional per user
10. **CAPTCHA** — Form registrasi publik

### Maintenance Mode

| Scope | Efek |
|-------|------|
| `registration` | Blok `/signup` saja |
| `patients` | Blok portal pasien + signup |
| `full` | Blok semua kecuali login admin sistem |

---

## 7. Deployment

| File | Fungsi |
|------|--------|
| `docker-compose.yml` | Dev: Postgres, Redis, MinIO |
| `docker-compose.prod.yml` | Prod: nginx + backend + frontend internal |
| `docker-compose.setup.yml` | Job migrasi/seed one-shot |
| `docker-compose.monitoring.yml` | Prometheus, Grafana, Loki |
| `docker/Dockerfile.*` | Image backend, frontend, nginx |
| `docs/DEPLOYMENT.md` | Panduan deploy lengkap |

---

## 8. Perintah Development

```bash
pnpm setup          # Setup pertama kali
pnpm dev            # Frontend + backend parallel
pnpm db:migrate     # Deploy migrasi
pnpm db:seed        # Seed data demo
pnpm lint           # ESLint monorepo
pnpm typecheck      # TypeScript check
pnpm test:policy    # Tes policy engine ABAC
pnpm build          # Build production
```

---

## 9. Role & Permission Matrix (Ringkas)

| Role | Dashboard | Permission utama |
|------|-----------|------------------|
| SYSTEM_ADMIN | `/system-admin` | Semua permission |
| HOSPITAL_ADMIN | `/hospital-admin` | Operasional RS, staff, laporan |
| DOCTOR | `/doctor` | Pasien, kunjungan, rekam medis, order lab/radiologi |
| NURSE | `/staff` | Antrian, kunjungan, rekam medis read/write |
| CASHIER | `/staff` | Billing read/write/approve |
| PHARMACIST | `/staff` | Farmasi dispense, inventory |
| LAB_ANALYST | `/staff` | Lab write/verify |
| RADIOLOGIST | `/staff` | Radiologi write/verify |
| RECEPTIONIST | `/staff` | Registrasi, antrian, appointment |
| PATIENT | `/patient` | Self-service terbatas (janji, hasil, billing) |

---

## 10. Testing

| File | Cakupan |
|------|---------|
| `apps/backend/test/policy.engine.test.ts` | Unit test PolicyEngine ABAC |

**Catatan:** Coverage test keseluruhan masih minim. Target workspace: 80% unit + integration + E2E.

---

## 11. Peta File per Direktori

```
apps/backend/src/
├── main.ts, app.module.ts, app.controller.ts
├── common/          → auth guards, HTTP, pagination, validators
├── config/          → env validation
├── shared/          → prisma, redis, storage, encryption
└── modules/         → 30 modul domain (lihat §2.4)

apps/frontend/src/
├── middleware.ts
├── app/             → pages & layouts (dashboard, app, portal, public)
├── components/      → UI components
├── hooks/           → React hooks
└── lib/             → API clients, auth, routing utils

packages/
├── db/              → prisma schema, seed, encryption utils
└── shared/          → constants & types

scripts/             → setup, db-reset, inject-file-documentation
docker/              → Dockerfiles, nginx, entrypoints
docs/                → DEPLOYMENT.md, CODEBASE.md (ini)
```

---

*Terakhir diperbarui: regenerasi otomatis via `scripts/inject-file-documentation.ts`*
