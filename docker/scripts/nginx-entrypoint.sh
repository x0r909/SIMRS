#!/bin/sh
set -eu

CERT_DIR=/etc/nginx/certs
mkdir -p "$CERT_DIR"

if [ ! -f "$CERT_DIR/privkey.pem" ] || [ ! -f "$CERT_DIR/fullchain.pem" ]; then
  echo "[nginx] Generating self-signed TLS certificate..."
  openssl req -x509 -nodes -days 825 -newkey rsa:2048 \
    -keyout "$CERT_DIR/privkey.pem" \
    -out "$CERT_DIR/fullchain.pem" \
    -subj "/CN=${NGINX_SSL_CN:-simrs.local}/O=SIMRS/C=ID"
fi

if [ "${NGINX_REDIRECT_HTTP_TO_HTTPS:-false}" = "true" ]; then
  echo "[nginx] HTTP -> HTTPS redirect enabled"
  cat > /etc/nginx/conf.d/00-http-redirect.conf <<'EOF'
server {
  listen 80;
  server_name _;
  return 301 https://$host$request_uri;
}
EOF
  rm -f /etc/nginx/conf.d/default.conf
  cat > /etc/nginx/conf.d/01-https.conf <<'EOF'
upstream simrs_frontend {
  server frontend:3000;
}

upstream simrs_backend {
  server backend:4000;
}

server {
  listen 443 ssl;
  http2 on;
  server_name _;

  ssl_certificate /etc/nginx/certs/fullchain.pem;
  ssl_certificate_key /etc/nginx/certs/privkey.pem;
  ssl_protocols TLSv1.2 TLSv1.3;
  ssl_prefer_server_ciphers off;

  include /etc/nginx/snippets/simrs-locations.conf;
}
EOF
else
  rm -f /etc/nginx/conf.d/00-http-redirect.conf /etc/nginx/conf.d/01-https.conf
fi

exec nginx -g 'daemon off;'
