#!/usr/bin/env bash
# Migrasi & seed di dalam container (dipanggil oleh docker compose profile setup).
set -euo pipefail

cd /workspace

export DATABASE_URL="${DATABASE_URL:-postgresql://simrs:simrs@postgres:5432/simrs?schema=public}"

echo "==> Install pnpm & dependensi @simrs/db"
corepack enable
corepack prepare pnpm@9.15.6 --activate
pnpm install --filter @simrs/db... --frozen-lockfile 2>/dev/null || pnpm install --filter @simrs/db...

echo "==> prisma generate"
pnpm --filter @simrs/db db:generate

echo "==> prisma migrate deploy"
pnpm --filter @simrs/db db:migrate

echo "==> prisma db seed"
pnpm --filter @simrs/db db:seed

echo "==> Database setup selesai."
