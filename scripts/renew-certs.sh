#!/bin/bash
# Renew Let's Encrypt wildcard certificate
# Requires certbot and a DNS plugin (e.g., certbot-dns-cloudflare)
#
# Usage: ./renew-certs.sh
#
# Set up as a cron job:
#   0 3 * * * /path/to/renew-certs.sh

set -e

DOMAIN="${DOMAIN:-homevpn.example.com}"
CERT_DIR="$(dirname "$0")/../haproxy/certs"

# Renew certificate
certbot certonly \
    --dns-cloudflare \
    --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
    -d "*.${DOMAIN}" \
    -d "${DOMAIN}" \
    --non-interactive \
    --agree-tos

# Combine cert + key for HAProxy
cat "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" \
    "/etc/letsencrypt/live/${DOMAIN}/privkey.pem" \
    > "${CERT_DIR}/homevpn.pem"

# Reload HAProxy
docker compose exec haproxy kill -USR2 1

echo "Certificate renewed and HAProxy reloaded."
