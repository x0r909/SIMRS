# SIMRS v2

Sistem Informasi Manajemen Rumah Sakit (SIMRS) — monorepo untuk operasional rumah sakit, portal pasien, dan administrasi sistem.

## Stack

| Lapisan | Teknologi |
|--------|-----------|
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS, shadcn/ui |
| Backend | NestJS 11, JWT, RBAC/ABAC |
| Database | PostgreSQL 16, Prisma 6 |
| Cache & sesi | Redis 7 |
| Object storage | MinIO |
| Monorepo | pnpm workspace + Turborepo |

## Fitur utama

- **Multi-role dashboard** — Admin Sistem, Admin Rumah Sakit (user dengan role), Dokter, Staff, Pasien
- **Login terpisah** — portal staff (`/login`) dan portal pasien (`/patient-login`)
- **Registrasi pasien** — self-service di `/signup`
- **Mode maintenance** — cakupan registrasi / portal pasien / penuh (Admin Sistem)
- **Modul klinis** — pasien, janji temu, antrian, kunjungan, rekam medis, resep, farmasi, lab, radiologi, billing
- **Keamanan** — MFA TOTP, session Redis, brute-force lockout, enkripsi field sensitif, audit log & system log
- **Operasional** — health check, backup database, laporan harian RS, monitoring (Prometheus/Grafana/Loki)

## Struktur repositori

```text
apps/
  backend/              NestJS API (@simrs/backend)
  frontend/             Next.js web app (@simrs/frontend)
packages/
  db/                   Prisma schema, migrasi, seed (@simrs/db)
  shared/               Konstanta & tipe bersama (@simrs/shared)
scripts/                Setup lokal, migrasi & seed
docker-compose.yml      PostgreSQL, Redis, MinIO
docker-compose.setup.yml  Migrasi & seed via container (opsional)
docs/                   Panduan deployment & operasional
```

## Prasyarat

- **Node.js** 20+
- **pnpm** 9+ (`corepack enable && corepack prepare pnpm@9.15.6 --activate`)
- **Docker** & Docker Compose (untuk PostgreSQL, Redis, MinIO)
- **Bash** (untuk script setup di macOS/Linux; di Windows gunakan Git Bash atau WSL)

## Quick start (setup otomatis)

```bash
git clone <url-repo> simrs
cd simrs
pnpm setup
```

Perintah `pnpm setup` akan:

1. Menyalin file `.env` dari contoh (jika belum ada)
2. Menjalankan `pnpm install`
3. Menjalankan `docker compose up -d`
4. Menunggu PostgreSQL siap → `prisma generate` → `migrate deploy` → `db seed`

Lalu jalankan aplikasi:

```bash
pnpm dev
```

## Setup manual (langkah demi langkah)

### 1. Install dependensi

```bash
pnpm install
```

### 2. Environment

```bash
cp .env.example .env
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

`DATABASE_URL` harus konsisten di `packages/db/.env` dan `apps/backend/.env`:

```text
postgresql://simrs:simrs@localhost:5432/simrs?schema=public
```

Variabel root `.env` mengatur kredensial Docker (lihat `.env.example`).

Generate secret produksi (JWT & enkripsi):

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Infrastruktur Docker

```bash
pnpm docker:up
```

Layanan yang dijalankan:

| Container | Image | Port default |
|-----------|-------|----------------|
| `simrs-postgres` | postgres:16-alpine | 5432 |
| `simrs-redis` | redis:7-alpine | 6379 |
| `simrs-minio` | minio | 9000 (API), 9001 (console) |

Cek status:

```bash
docker compose ps
pnpm docker:logs
```

### 4. Migrasi & seeding database

**Cara A — di host (disarankan untuk development):**

```bash
pnpm db:setup
```

Setara dengan:

```bash
bash scripts/db-setup.sh
# → wait postgres → pnpm db:generate → pnpm db:migrate → pnpm db:seed
```

**Cara B — di dalam container Docker:**

```bash
pnpm docker:up
pnpm docker:db-setup
```

**Perintah terpisah:**

```bash
pnpm db:generate      # prisma generate
pnpm db:migrate       # prisma migrate deploy (production / CI)
pnpm db:migrate:dev   # prisma migrate dev (buat migrasi baru)
pnpm db:seed          # seed data awal
```

**Reset database development (hapus semua data):**

```bash
pnpm db:reset
```

### 5. Jalankan development

```bash
pnpm dev
```

Atau terpisah:

```bash
pnpm dev:backend   # API :4000
pnpm dev:frontend  # Web :3050
```

## URL development

| Layanan | URL |
|---------|-----|
| Frontend | http://localhost:3050 |
| Login staff | http://localhost:3050/login |
| Login pasien | http://localhost:3050/patient-login |
| Daftar pasien | http://localhost:3050/signup |
| Admin Sistem | http://localhost:3050/system-admin |
| Admin Rumah Sakit | http://localhost:3050/hospital-admin |
| Backend API | http://localhost:4000/v1 |
| Swagger | http://localhost:4000/docs |
| Health check | http://localhost:4000/v1/health |
| MinIO API | http://localhost:9000 |
| MinIO Console | http://localhost:9001 |

### Akses dari jaringan lokal (LAN)

Frontend dev server listen di `0.0.0.0`. Dari perangkat lain di WiFi yang sama:

```text
http://<IP-komputer-host>:3050
```

`NEXT_PUBLIC_API_URL` boleh tetap `http://127.0.0.1:4000` — browser di perangkat lain otomatis memanggil API ke IP host yang sama.

## Login & akun seed

Password default semua akun seed: **`Admin123!`**

| Role | Email | Portal login | Dashboard |
|------|-------|--------------|-----------|
| Admin Sistem | `admin@simrs.local` | `/login` | `/system-admin` |
| Admin Rumah Sakit | `hospital-admin@simrs.local` | `/login` | `/hospital-admin` |
| Dokter | `doctor@simrs.local` | `/login` | `/doctor` |
| Staff / Kasir / dll. | lihat `packages/db/prisma/seed.ts` | `/login` | `/staff` |
| Pasien | `pasien.andi@simrs.local` | `/patient-login` | `/patient` |

**Catatan peran:**

- **Admin Sistem** — mengelola platform (pengaturan sistem, backup, log, maintenance).
- **Admin Rumah Sakit** — user biasa dengan role `HOSPITAL_ADMIN`; mengelola operasional RS (staff, departemen, laporan). Profil pribadi di **Profil Saya**, bukan pengaturan institusi.

**Penting:** akun pasien hanya bisa login lewat `/patient-login`. Akun staff hanya lewat `/login`.

Contoh API:

```http
POST /v1/auth/login/staff
Content-Type: application/json

{ "email": "admin@simrs.local", "password": "Admin123!" }
```

```http
PATCH /v1/auth/profile
Authorization: Bearer <token>
Content-Type: application/json

{ "name": "Nama Baru", "email": "user@simrs.local" }
```

## Perintah npm

```bash
# Setup & development
pnpm setup              # setup lengkap pertama kali
pnpm dev
pnpm dev:backend
pnpm dev:frontend

# Kualitas kode
pnpm lint
pnpm typecheck
pnpm format
pnpm build

# Database
pnpm db:generate
pnpm db:migrate         # deploy migrasi
pnpm db:migrate:dev     # migrasi interaktif (dev)
pnpm db:seed
pnpm db:setup           # generate + migrate + seed
pnpm db:reset           # hapus volume DB + setup ulang

# Docker
pnpm docker:up
pnpm docker:down
pnpm docker:logs
pnpm docker:db-setup    # migrasi + seed di container

# Tes
pnpm test:policy
```

## Docker Compose

| File | Fungsi |
|------|--------|
| `docker-compose.yml` | PostgreSQL, Redis, MinIO |
| `docker-compose.setup.yml` | Job one-shot migrasi & seed (`--profile setup`) |
| `docker-compose.monitoring.yml` | Prometheus, Grafana, Loki (opsional) |

Monitoring (opsional):

```bash
docker compose -f docker-compose.monitoring.yml up -d
```

## Production lokal

```bash
pnpm build
pnpm --filter @simrs/backend start
pnpm --filter @simrs/frontend start
```

Panduan lengkap: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

## CI

GitHub Actions (`.github/workflows/ci.yml`) menjalankan `lint`, `typecheck`, `test:policy`, dan `build` pada push/PR ke `main` / `develop`.

## Troubleshooting

### Prisma `EPERM` / engine lock (Windows)

Hentikan proses Node yang masih berjalan, lalu:

```bash
pnpm db:generate
```

### Migrasi gagal / DB tidak sinkron

```bash
pnpm db:migrate:dev
```

Atau reset penuh:

```bash
pnpm db:reset
```

### PostgreSQL belum siap saat migrate

Script `db:setup` menunggu Postgres otomatis. Manual:

```bash
bash scripts/wait-for-postgres.sh
pnpm db:migrate
```

### Frontend tidak bisa hubungi API

- Pastikan backend berjalan (`pnpm dev:backend`)
- Cek `apps/backend/.env` → `DATABASE_URL`, `REDIS_URL`
- Cek `apps/frontend/.env` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000`

### Backup gagal di macOS (`pg_dump` tidak ditemukan)

Set di `apps/backend/.env`:

```text
POSTGRES_CONTAINER_NAME=simrs-postgres
```

Backend akan memakai `docker exec` sebagai fallback.

### MinIO unhealthy

```bash
docker logs simrs-minio
pnpm docker:up
```

### Permission Admin Rumah Sakit tidak lengkap setelah update

Jalankan ulang seed (idempotent untuk role/permission):

```bash
pnpm db:seed
```

## Lisensi

Private — hak cipta pemilik repositori.
