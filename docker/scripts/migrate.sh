#!/usr/bin/env sh
set -eu

cd /app

echo "==> Menunggu PostgreSQL..."
POSTGRES_HOST="${POSTGRES_HOST:-postgres}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-simrs}"
POSTGRES_DB="${POSTGRES_DB:-simrs}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if node -e "
    const net = require('node:net');
    const socket = net.connect({ host: process.argv[1], port: Number(process.argv[2]) });
    socket.on('connect', () => { socket.end(); process.exit(0); });
    socket.on('error', () => process.exit(1));
  " "$POSTGRES_HOST" "$POSTGRES_PORT"; then
    echo "PostgreSQL siap."
    break
  fi
  echo "  percobaan ${attempt}/${MAX_ATTEMPTS}..."
  attempt=$((attempt + 1))
  if [ "$attempt" -gt "$MAX_ATTEMPTS" ]; then
    echo "PostgreSQL tidak siap." >&2
    exit 1
  fi
  sleep "$SLEEP_SECONDS"
done

export DATABASE_URL="${DATABASE_URL:-postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public}"

echo "==> prisma generate"
pnpm --filter @simrs/db db:generate

echo "==> prisma migrate deploy"
pnpm --filter @simrs/db db:migrate

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  echo "==> prisma db seed"
  pnpm --filter @simrs/db db:seed
fi

echo "==> Migrasi selesai."
