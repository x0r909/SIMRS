#!/usr/bin/env bash
# Setup lokal pertama kali: env → docker → migrasi → seed.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

copy_if_missing() {
  local src="$1"
  local dest="$2"
  if [[ ! -f "$dest" ]]; then
    cp "$src" "$dest"
    echo "  dibuat: $dest"
  else
    echo "  sudah ada: $dest (dilewati)"
  fi
}

echo "==> SIMRS local setup"
echo ""

echo "==> 1/4 Salin file environment"
copy_if_missing .env.example .env
copy_if_missing packages/db/.env.example packages/db/.env
copy_if_missing apps/backend/.env.example apps/backend/.env
copy_if_missing apps/frontend/.env.example apps/frontend/.env
echo ""

echo "==> 2/4 Install dependensi Node"
pnpm install
echo ""

echo "==> 3/4 Jalankan infrastruktur Docker"
pnpm docker:up
echo ""

echo "==> 4/4 Migrasi & seed database"
bash scripts/db-setup.sh
echo ""

echo "Setup selesai. Jalankan aplikasi dengan:"
echo "  pnpm dev"
echo ""
echo "URL:"
echo "  Frontend  http://localhost:3050"
echo "  Backend   http://localhost:4000/v1"
echo "  Swagger   http://localhost:4000/docs"
