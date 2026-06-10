#!/usr/bin/env bash
# Generate Prisma client, jalankan migrasi, dan seed (dijalankan di host).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> SIMRS database setup"

if [[ ! -f packages/db/.env ]]; then
  echo "File packages/db/.env belum ada. Salin dari packages/db/.env.example terlebih dahulu." >&2
  exit 1
fi

export POSTGRES_HOST="${POSTGRES_HOST:-localhost}"
export POSTGRES_PORT="${POSTGRES_PORT:-5432}"
export POSTGRES_USER="${POSTGRES_USER:-simrs}"
export POSTGRES_DB="${POSTGRES_DB:-simrs}"
export POSTGRES_CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-simrs-postgres}"

bash scripts/wait-for-postgres.sh

echo "==> prisma generate"
pnpm db:generate

echo "==> prisma migrate deploy"
pnpm db:migrate

echo "==> prisma db seed"
pnpm db:seed

echo "==> Selesai. Database siap digunakan."
