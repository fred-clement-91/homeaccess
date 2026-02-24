#!/bin/bash
set -e

# HomeVPN installation script for host deployment on domoteus.com
# SSH: ssh fclement@domoteus.com
# Run with: sudo bash install.sh

APP_DIR="/opt/homevpn"
APP_USER="homevpn"

echo "=== HomeVPN Installation ==="

# 1. Install system dependencies
echo "[1/9] Installing system dependencies..."
apt-get update
apt-get install -y python3 python3-venv python3-pip \
    wireguard-tools \
    postgresql postgresql-contrib \
    nginx \
    certbot \
    nodejs npm

# 2. Create app user
echo "[2/9] Creating application user..."
if ! id "$APP_USER" &>/dev/null; then
    useradd -r -s /bin/false -d "$APP_DIR" "$APP_USER"
fi

# 3. Create app directory
echo "[3/9] Setting up application directory..."
mkdir -p "$APP_DIR"
cp -r backend "$APP_DIR/"
cp -r frontend "$APP_DIR/"
if [ ! -f "$APP_DIR/.env" ]; then
    cp .env.example "$APP_DIR/.env"
    echo "IMPORTANT: Edit /opt/homevpn/.env with your actual secrets!"
fi

# 4. Python virtual environment
echo "[4/9] Setting up Python virtual environment..."
python3 -m venv "$APP_DIR/venv"
"$APP_DIR/venv/bin/pip" install --upgrade pip
"$APP_DIR/venv/bin/pip" install -r "$APP_DIR/backend/requirements.txt"

# 5. Build frontend
echo "[5/9] Building frontend..."
cd "$APP_DIR/frontend"
npm ci
npm run build
cd -

# 6. Setup PostgreSQL
echo "[6/9] Configuring PostgreSQL..."
sudo -u postgres psql -c "CREATE USER homevpn WITH PASSWORD 'changeme';" 2>/dev/null || true
sudo -u postgres psql -c "CREATE DATABASE homevpn OWNER homevpn;" 2>/dev/null || true

# 7. Setup WireGuard
echo "[7/9] Configuring WireGuard..."
if [ ! -f /etc/wireguard/wg0.conf ]; then
    SERVER_PRIVATE_KEY=$(wg genkey)
    SERVER_PUBLIC_KEY=$(echo "$SERVER_PRIVATE_KEY" | wg pubkey)

    cat > /etc/wireguard/wg0.conf <<EOF
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
    chmod 600 /etc/wireguard/wg0.conf
    echo "WireGuard server public key: $SERVER_PUBLIC_KEY"
    systemctl enable wg-quick@wg0
    systemctl start wg-quick@wg0
else
    echo "WireGuard config already exists, skipping."
fi

# 8. Configure sudoers for wg commands (no password required for the service user)
echo "[8/9] Configuring permissions..."
cat > /etc/sudoers.d/homevpn <<SUDOERS
homevpn ALL=(root) NOPASSWD: /usr/bin/wg, /usr/bin/wg-quick, /usr/bin/systemctl reload haproxy
SUDOERS
chmod 440 /etc/sudoers.d/homevpn

# 9. Install services
echo "[9/9] Installing systemd service and nginx config..."
cp deploy/homevpn-api.service /etc/systemd/system/
cp deploy/nginx-homevpn.conf /etc/nginx/sites-available/homevpn
ln -sf /etc/nginx/sites-available/homevpn /etc/nginx/sites-enabled/homevpn

# Create empty HAProxy files
touch /etc/haproxy/homevpn-backends.cfg
touch /etc/haproxy/homevpn-subdomains.map

# Set permissions
chown -R "$APP_USER:$APP_USER" "$APP_DIR"
chown "$APP_USER:$APP_USER" /etc/haproxy/homevpn-backends.cfg /etc/haproxy/homevpn-subdomains.map

# Run migrations
echo "Running database migrations..."
cd "$APP_DIR/backend"
sudo -u "$APP_USER" DATABASE_URL="$(grep DATABASE_URL $APP_DIR/.env | cut -d= -f2-)" \
    "$APP_DIR/venv/bin/alembic" upgrade head

# Enable and start services
systemctl daemon-reload
systemctl enable homevpn-api
systemctl start homevpn-api
systemctl reload nginx

echo ""
echo "=== Installation complete ==="
echo ""
echo "Next steps:"
echo "  1. Edit /opt/homevpn/.env with your actual secrets"
echo "     - JWT_SECRET, FERNET_KEY, SMTP settings, DB password"
echo "  2. Add HAProxy integration (see deploy/haproxy-homevpn-snippet.cfg)"
echo "  3. Restart the API: sudo systemctl restart homevpn-api"
echo "  4. Set up Let's Encrypt wildcard cert for *.domoteus.com"
echo ""
