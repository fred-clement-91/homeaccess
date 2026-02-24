#!/bin/bash
set -e

WG_CONF="/etc/wireguard/wg0.conf"

# Generate server keys if they don't exist
if [ ! -f /etc/wireguard/server_private.key ]; then
    echo "Generating WireGuard server keys..."
    wg genkey | tee /etc/wireguard/server_private.key | wg pubkey > /etc/wireguard/server_public.key
    chmod 600 /etc/wireguard/server_private.key
fi

SERVER_PRIVATE_KEY=$(cat /etc/wireguard/server_private.key)

# Create initial wg0.conf if it doesn't exist
if [ ! -f "$WG_CONF" ]; then
    echo "Creating initial WireGuard config..."
    cat > "$WG_CONF" <<EOF
[Interface]
Address = 10.8.0.1/16
ListenPort = 51820
PrivateKey = ${SERVER_PRIVATE_KEY}
PostUp = iptables -I FORWARD -i wg0 -o wg0 -j REJECT --reject-with icmp-admin-prohibited
PostUp = iptables -A FORWARD -i %i -j ACCEPT
PostUp = iptables -A FORWARD -o %i -j ACCEPT
PostUp = iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i wg0 -o wg0 -j REJECT --reject-with icmp-admin-prohibited
PostDown = iptables -D FORWARD -i %i -j ACCEPT
PostDown = iptables -D FORWARD -o %i -j ACCEPT
PostDown = iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF
    chmod 600 "$WG_CONF"
fi

echo "Starting WireGuard interface wg0..."
wg-quick up wg0

echo "WireGuard is running. Server public key:"
wg show wg0 public-key

# Keep the container alive
exec sleep infinity
