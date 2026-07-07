#!/usr/bin/env bash
# Generate (or regenerate) self-signed TLS certificate for nginx.
# Usage: ./docker/scripts/generate-nginx-certs.sh [CN]
# Example: ./docker/scripts/generate-nginx-certs.sh 192.168.1.10

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
CERT_DIR="$ROOT/docker/nginx/certs"
CN="${1:-simrs.local}"

mkdir -p "$CERT_DIR"

openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
  -keyout "$CERT_DIR/privkey.pem" \
  -out "$CERT_DIR/fullchain.pem" \
  -subj "/CN=${CN}/O=SIMRS/C=ID"

echo "Certificate written to $CERT_DIR"
echo "  CN=$CN"
echo "Restart nginx: docker compose -f docker-compose.prod.yml restart nginx"
