#!/usr/bin/env bash
# Tunggu PostgreSQL siap menerima koneksi (host atau container).
set -euo pipefail

HOST="${POSTGRES_HOST:-localhost}"
PORT="${POSTGRES_PORT:-5432}"
USER="${POSTGRES_USER:-simrs}"
DB="${POSTGRES_DB:-simrs}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"

echo "Menunggu PostgreSQL di ${HOST}:${PORT} (db=${DB}, user=${USER})..."

for ((i = 1; i <= MAX_ATTEMPTS; i++)); do
  if command -v pg_isready >/dev/null 2>&1; then
    if pg_isready -h "$HOST" -p "$PORT" -U "$USER" -d "$DB" >/dev/null 2>&1; then
      echo "PostgreSQL siap."
      exit 0
    fi
  elif command -v docker >/dev/null 2>&1 && docker ps --format '{{.Names}}' | grep -qx "${POSTGRES_CONTAINER_NAME:-simrs-postgres}"; then
    if docker exec "${POSTGRES_CONTAINER_NAME:-simrs-postgres}" pg_isready -U "$USER" -d "$DB" >/dev/null 2>&1; then
      echo "PostgreSQL siap (via container ${POSTGRES_CONTAINER_NAME:-simrs-postgres})."
      exit 0
    fi
  else
    if (echo >/dev/tcp/"$HOST"/"$PORT") >/dev/null 2>&1; then
      echo "Port ${PORT} terbuka di ${HOST}."
      exit 0
    fi
  fi

  echo "  percobaan ${i}/${MAX_ATTEMPTS}..."
  sleep "$SLEEP_SECONDS"
done

echo "PostgreSQL tidak siap setelah $((MAX_ATTEMPTS * SLEEP_SECONDS)) detik." >&2
exit 1
