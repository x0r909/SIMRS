# SIMRS v2

[![CI](https://github.com/x0r909/SIMRS/actions/workflows/ci.yml/badge.svg)](https://github.com/x0r909/SIMRS/actions/workflows/ci.yml)
![Node](https://img.shields.io/badge/node-%3E%3D20-339933?logo=node.js&logoColor=white)
![pnpm](https://img.shields.io/badge/pnpm-9-F69220?logo=pnpm&logoColor=white)
![License](https://img.shields.io/badge/license-Private-red)

**Sistem Informasi Manajemen Rumah Sakit (SIMRS)** — monorepo full-stack untuk operasional rumah sakit, portal pasien, dan administrasi platform.

| Lapisan | Teknologi |
|---------|-----------|
| Frontend | Next.js 15, React 19, Tailwind CSS, shadcn/ui |
| Backend | NestJS 11, JWT, RBAC/ABAC |
| Database | PostgreSQL 16, Prisma 6 |
| Cache & sesi | Redis 7 |
| Object storage | MinIO |
| Monorepo | pnpm workspace + Turborepo |

---

## Daftar isi

- [Fitur utama](#fitur-utama)
- [Quick start](#quick-start)
- [Dokumentasi](#dokumentasi)
- [Struktur repositori](#struktur-repositori)
- [Setup manual](#setup-manual)
- [URL development](#url-development)
- [Akun demo (seed)](#akun-demo-seed)
- [Perintah](#perintah)
- [Production (Docker)](#production-docker)
- [CI/CD](#cicd)
- [Keamanan & file sensitif](#keamanan--file-sensitif)
- [Troubleshooting](#troubleshooting)
- [Lisensi](#lisensi)

---

## Fitur utama

- **Multi-role dashboard** — Admin Sistem, Admin Rumah Sakit, Dokter, Staff, Pasien
- **Login terpisah** — staff (`/login`) dan pasien (`/patient-login`)
- **Registrasi pasien** — self-service di `/signup`
- **Mode maintenance** — scope registrasi / portal pasien / penuh
- **Modul klinis** — pasien, janji temu, antrian, kunjungan, rekam medis, resep, farmasi, lab, radiologi, billing
- **Keamanan** — MFA TOTP, sesi Redis, brute-force lockout, rate limiting, enkripsi field sensitif, audit & system log
- **Operasional** — health check, backup database, laporan harian RS, monitoring (Prometheus/Grafana/Loki)

---

## Quick start

**Prasyarat:** Node.js 20+, pnpm 9+, Docker & Docker Compose, Bash (atau Git Bash/WSL di Windows).

```bash
git clone https://github.com/x0r909/SIMRS.git
cd SIMRS
pnpm setup
pnpm dev
```

`pnpm setup` akan: salin `.env` dari contoh → `pnpm install` → `docker compose up -d` → migrasi & seed database.

| Layanan | URL |
|---------|-----|
| Frontend | http://localhost:3050 |
| API | http://localhost:4000/v1 |
| Swagger | http://localhost:4000/docs |

---

## Dokumentasi

| Dokumen | Isi |
|---------|-----|
| [`docs/CODEBASE.md`](docs/CODEBASE.md) | Arsitektur, modul backend/frontend, routing, keamanan, peta file |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Deploy production Docker, checklist, UAT |
| Header `@file` inline | Setiap `.ts`/`.tsx` — regenerasi: `pnpm docs:inject` |

---

## Struktur repositori

```text
apps/
  backend/                 NestJS API (@simrs/backend)
  frontend/                Next.js web app (@simrs/frontend)
packages/
  db/                      Prisma schema, migrasi, seed (@simrs/db)
  shared/                  Konstanta & tipe bersama (@simrs/shared)
scripts/                   Setup lokal, migrasi, dokumentasi
docker/                    Dockerfile production & nginx
docker-compose.yml         PostgreSQL, Redis, MinIO (development)
docker-compose.prod.yml    Stack produksi (nginx gateway)
docker-compose.setup.yml   Migrasi & seed via container
docs/                      Panduan teknis
```

---

## Setup manual

### 1. Dependensi

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

`DATABASE_URL` harus sama di `packages/db/.env` dan `apps/backend/.env`:

```text
postgresql://simrs:simrs@localhost:5432/simrs?schema=public
```

Set **`SEED_DEFAULT_PASSWORD`** di `.env` (min. 12 karakter) sebelum `pnpm db:seed`.

Generate secret produksi:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

### 3. Infrastruktur & database

```bash
pnpm docker:up      # Postgres, Redis, MinIO
pnpm db:setup       # generate + migrate + seed
pnpm dev            # frontend :3050 + backend :4000
```

---

## URL development

| Layanan | URL |
|---------|-----|
| Login staff | http://localhost:3050/login |
| Login pasien | http://localhost:3050/patient-login |
| Daftar pasien | http://localhost:3050/signup |
| Admin Sistem | http://localhost:3050/system-admin |
| Admin Rumah Sakit | http://localhost:3050/hospital-admin |
| Health check | http://localhost:4000/v1/health |
| MinIO Console | http://localhost:9001 |

**Akses LAN:** frontend listen di `0.0.0.0` — buka `http://<IP-host>:3050` dari perangkat lain di jaringan yang sama.

---

## Akun demo (seed)

Password semua akun mengikuti **`SEED_DEFAULT_PASSWORD`** di `.env` (bukan hardcoded).

| Role | Email | Login | Dashboard |
|------|-------|-------|-----------|
| Admin Sistem | `admin@simrs.local` | `/login` | `/system-admin` |
| Admin RS | `hospital-admin@simrs.local` | `/login` | `/hospital-admin` |
| Dokter | `doctor@simrs.local` | `/login` | `/doctor` |
| Staff | lihat `packages/db/prisma/seed.ts` | `/login` | `/staff` |
| Pasien | `patient@simrs.local` | `/patient-login` | `/patient` |

> Akun pasien **hanya** `/patient-login`. Staff **hanya** `/login`.

```http
POST /v1/auth/login/staff
Content-Type: application/json

{ "email": "admin@simrs.local", "password": "<SEED_DEFAULT_PASSWORD>" }
```

---

## Perintah

```bash
# Setup & dev
pnpm setup
pnpm dev
pnpm dev:backend
pnpm dev:frontend

# Kualitas kode
pnpm lint
pnpm typecheck
pnpm format
pnpm build
pnpm test:policy

# Database
pnpm db:generate
pnpm db:migrate
pnpm db:migrate:dev
pnpm db:seed
pnpm db:setup
pnpm db:reset

# Docker — development
pnpm docker:up
pnpm docker:down
pnpm docker:logs
pnpm docker:db-setup

# Docker — production
pnpm docker:prod:up
pnpm docker:prod:down
pnpm docker:prod:logs
pnpm docker:prod:build

# Dokumentasi inline
pnpm docs:inject
```

---

## Production (Docker)

```bash
cp .env.production.example .env.production
# Edit semua secret di .env.production
pnpm docker:prod:up
```

Hanya **nginx** diekspos ke host (`:80` / `:443`). API tersedia di `/v1`, Swagger di `/docs`.

| File compose | Fungsi |
|--------------|--------|
| `docker-compose.yml` | Dev: Postgres, Redis, MinIO |
| `docker-compose.prod.yml` | Prod: nginx + backend + frontend |
| `docker-compose.setup.yml` | Job migrasi/seed one-shot |
| `docker-compose.monitoring.yml` | Prometheus, Grafana, Loki (opsional) |

Detail lengkap: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md)

---

## CI/CD

GitHub Actions (`.github/workflows/ci.yml`) pada push/PR ke `main` / `develop`:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:policy`
4. `pnpm build`

---

## Keamanan & file sensitif

**Jangan commit ke GitHub:**

| File | Alasan |
|------|--------|
| `.env`, `.env.production` | Secret JWT, enkripsi, password DB |
| `example-db.txt` | Dump SQL dengan kredensial |
| `packages/db/loginreq.json` | Kredensial login lokal |
| `docker/nginx/certs/*.pem` | Sertifikat TLS generate lokal |
| `apps/backend/backups/` | Backup database |

**File contoh yang boleh di-commit:** `.env.example`, `.env.production.example`, `apps/*/.env.example`

Jika secret terlanjur ter-push, **rotate segera** semua JWT & encryption key.

---

## Troubleshooting

<details>
<summary><strong>Frontend tidak bisa hubungi API</strong></summary>

- Pastikan backend jalan: `pnpm dev:backend`
- Cek `apps/backend/.env` → `DATABASE_URL`, `REDIS_URL`
- Cek `apps/frontend/.env` → `NEXT_PUBLIC_API_URL=http://127.0.0.1:4000`
</details>

<details>
<summary><strong>Migrasi gagal / DB tidak sinkron</strong></summary>

```bash
pnpm db:migrate:dev   # development
pnpm db:reset         # reset penuh (hapus data)
```
</details>

<details>
<summary><strong>Enum FILE_UPLOAD sudah ada</strong></summary>

```bash
cd packages/db
npx prisma migrate resolve --applied "20260608090758_add_auth_security_models"
pnpm db:migrate
```
</details>

<details>
<summary><strong>Backup gagal di macOS (pg_dump tidak ditemukan)</strong></summary>

Set di `apps/backend/.env`:

```text
POSTGRES_CONTAINER_NAME=simrs-postgres
```
</details>

<details>
<summary><strong>Permission Admin RS tidak lengkap</strong></summary>

```bash
pnpm db:seed
```
</details>

Lihat juga bagian troubleshooting lengkap di commit history README atau buka issue di GitHub.

---

## Lisensi

Private — hak cipta pemilik repositori.
