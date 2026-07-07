# SIMRS v2 — Deployment Guide

## Prerequisites

- Node.js 20+
- pnpm 9+
- Docker & Docker Compose
- PostgreSQL 16, Redis 7, MinIO

## Local Development

```bash
pnpm install
cp .env.example .env
cp packages/db/.env.example packages/db/.env
cp apps/backend/.env.example apps/backend/.env
pnpm docker:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

## Environment Variables

See `apps/backend/.env.example` for required keys including:

- `DATABASE_URL`, `REDIS_URL`
- `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
- `ENCRYPTION_KEY`, `ENCRYPTION_SEARCH_KEY`, `BACKUP_ENCRYPTION_KEY`
- MinIO configuration

Generate encryption keys:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Production (Docker)

```bash
cp .env.production.example .env.production
# Edit secret di .env.production (JWT, encryption, password DB/MinIO)

pnpm docker:prod:up
```

Perintah di atas akan:

1. Build image `backend` dan `frontend`
2. Menjalankan PostgreSQL, Redis, MinIO
3. Menjalankan job migrasi (+ seed jika `SEED_DATABASE=true`)
4. Menjalankan backend dan frontend (internal) + **nginx** sebagai gateway (:80 / :443)

| URL | Keterangan |
|-----|------------|
| http://localhost/ | Frontend (via nginx) |
| https://localhost/ | Frontend HTTPS (sertifikat self-signed) |
| http://\<IP-laptop\>/ | Akses dari perangkat lain di LAN |
| http(s)://\<host\>/v1 | Backend API |
| http(s)://\<host\>/docs | Swagger |
| http(s)://\<host\>/v1/health | Health check |

Backend, frontend, Postgres, Redis, dan MinIO **tidak** diekspos ke host — hanya nginx.

**HTTPS:** sertifikat self-signed dibuat otomatis saat pertama kali nginx jalan. Untuk CN sesuai IP laptop:

```bash
./docker/scripts/generate-nginx-certs.sh 192.168.1.10
docker compose -f docker-compose.prod.yml --env-file .env.production restart nginx
```

Set `NGINX_SSL_CN=192.168.1.10` di `.env.production` sebelum deploy pertama agar CN otomatis benar.

Perintah lain:

```bash
pnpm docker:prod:build   # build image saja
pnpm docker:prod:down    # stop stack
pnpm docker:prod:logs    # tail logs
```

Setelah deploy stabil, set `SEED_DATABASE=false` di `.env.production`.

## Production Checklist

- [ ] Salin `.env.production.example` → `.env.production` dan ganti semua secret
- [ ] Run breaking migration `20260610120000_v2_schema` (otomatis via service `migrate`)
- [ ] Seed roles and default hospital (`SEED_DATABASE=true` pada deploy pertama)
- [ ] Set `NEXT_PUBLIC_API_URL=http://localhost` (API lewat nginx `/v1`; rebuild frontend jika diubah)
- [ ] Set `NGINX_SSL_CN` ke IP/domain laptop untuk sertifikat HTTPS
- [ ] HTTPS self-signed otomatis via nginx — ganti dengan sertifikat resmi jika perlu
- [ ] Enable Redis persistence (AOF) — sudah aktif di `docker-compose.prod.yml`
- [ ] Schedule daily backups via Admin Sistem
- [ ] Deploy monitoring stack: `docker compose -f docker-compose.monitoring.yml up -d`
- [ ] Verify `/v1/health` and `/v1/metrics`
- [ ] Set `SEED_DATABASE=false` setelah data awal ter-seed

## UAT Scenarios

1. Login per role → correct dashboard redirect
2. Doctor creates visit + medical record SOAP → finalize
3. Pharmacist dispenses prescription
4. System admin creates backup
5. Patient views own billing only
