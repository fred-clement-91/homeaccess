#!/bin/bash
set -e

KEYS_DIR="$(dirname "$0")/../wireguard/config"
mkdir -p "$KEYS_DIR"

if [ -f "$KEYS_DIR/server_private.key" ]; then
    echo "Server keys already exist. Delete them first to regenerate."
    exit 1
fi

wg genkey | tee "$KEYS_DIR/server_private.key" | wg pubkey > "$KEYS_DIR/server_public.key"
chmod 600 "$KEYS_DIR/server_private.key"

echo "Server keys generated:"
echo "  Private: $KEYS_DIR/server_private.key"
echo "  Public:  $(cat "$KEYS_DIR/server_public.key")"
