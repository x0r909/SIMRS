#!/usr/bin/env bash
# Hapus volume Postgres, naikkan ulang Docker, migrasi & seed dari awal.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

read -r -p "Ini akan MENGHAPUS semua data PostgreSQL di volume Docker. Lanjutkan? [y/N] " confirm
if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
  echo "Dibatalkan."
  exit 0
fi

echo "==> Stop container & hapus volume Docker"
docker compose down -v

echo "==> Start infrastruktur"
pnpm docker:up

bash scripts/db-setup.sh

echo "==> Database direset."
