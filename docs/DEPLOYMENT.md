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

## Production Checklist

- [ ] Run breaking migration `20260610120000_v2_schema`
- [ ] Seed roles and default hospital
- [ ] Configure TLS reverse proxy (nginx/Caddy)
- [ ] Enable Redis persistence (AOF)
- [ ] Schedule daily backups via Admin Sistem
- [ ] Deploy monitoring stack: `docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d`
- [ ] Verify `/v1/health` and `/v1/metrics`

## UAT Scenarios

1. Login per role → correct dashboard redirect
2. Doctor creates visit + medical record SOAP → finalize
3. Pharmacist dispenses prescription
4. System admin creates backup
5. Patient views own billing only
