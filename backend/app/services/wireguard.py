import subprocess
import time

from app.config import settings

# With PersistentKeepalive=10s, rx should increase every ~10s.
# 35s allows up to 3 missed keepalives before declaring disconnected,
# avoiding false negatives from network jitter.
RX_STALE_TIMEOUT = 35


class WireGuardService:
    def __init__(self):
        self.config_path = settings.wireguard_config_path
        self.endpoint = settings.wireguard_endpoint
        self.interface = settings.wireguard_interface
        # Track when each peer first became connected (pubkey -> timestamp)
        self._connected_since: dict[str, float] = {}
        # Track rx bytes to detect disconnection faster
        self._last_rx: dict[str, int] = {}
        self._last_rx_change: dict[str, float] = {}
        # Peers we've seen at least once (to avoid false positive on first read)
        self._initialized: set[str] = set()

    def generate_keypair(self) -> tuple[str, str]:
        private_key = subprocess.check_output(["wg", "genkey"]).decode().strip()
        public_key = subprocess.check_output(
            ["wg", "pubkey"], input=private_key.encode()
        ).decode().strip()
        return private_key, public_key

    def get_server_public_key(self) -> str:
        output = subprocess.check_output(
            ["sudo", "wg", "show", self.interface, "public-key"]
        ).decode().strip()
        return output

    def add_peer(self, public_key: str, allowed_ip: str) -> None:
        subprocess.run(
            ["sudo", "wg", "set", self.interface, "peer", public_key, "allowed-ips", f"{allowed_ip}/32"],
            check=True,
        )
        subprocess.run(["sudo", "wg-quick", "save", self.interface], check=True)

    def remove_peer(self, public_key: str) -> None:
        subprocess.run(
            ["sudo", "wg", "set", self.interface, "peer", public_key, "remove"],
            check=True,
        )
        subprocess.run(["sudo", "wg-quick", "save", self.interface], check=True)

    def get_peers_status(self) -> dict[str, dict]:
        """Return {public_key: {connected: bool, connected_since: int}} for all peers."""
        try:
            output = subprocess.check_output(
                ["sudo", "wg", "show", self.interface, "dump"]
            ).decode().strip()
        except Exception:
            return {}

        now = time.time()
        status: dict[str, dict] = {}
        # wg dump columns: pubkey, preshared, endpoint, allowed-ips,
        #                   latest-handshake, rx, tx, keepalive
        for line in output.splitlines()[1:]:  # skip header line
            parts = line.split("\t")
            if len(parts) >= 7:
                pubkey = parts[0]
                latest_handshake = int(parts[4]) if parts[4] != "0" else 0
                rx_bytes = int(parts[5]) if parts[5] != "0" else 0

                # First time seeing this peer: just record rx baseline, don't
                # mark as "changed" (avoids false positive after API restart)
                if pubkey not in self._initialized:
                    self._initialized.add(pubkey)
                    self._last_rx[pubkey] = rx_bytes
                    # Don't set _last_rx_change → stays at 0 → not connected
                else:
                    # Track rx changes: if rx increased, peer is alive
                    prev_rx = self._last_rx.get(pubkey, 0)
                    if rx_bytes > prev_rx:
                        self._last_rx[pubkey] = rx_bytes
                        self._last_rx_change[pubkey] = now

                last_rx_change = self._last_rx_change.get(pubkey, 0)
                # Connected = had a handshake AND rx still changing (keepalives)
                connected = (
                    latest_handshake > 0
                    and last_rx_change > 0
                    and (now - last_rx_change) < RX_STALE_TIMEOUT
                )

                # Track connection start time
                if connected:
                    if pubkey not in self._connected_since:
                        self._connected_since[pubkey] = now
                else:
                    self._connected_since.pop(pubkey, None)

                status[pubkey] = {
                    "connected": connected,
                    "connected_since": int(self._connected_since.get(pubkey, 0)),
                }
        return status

    def generate_client_config(
        self,
        private_key: str,
        address: str,
        server_public_key: str,
    ) -> str:
        # AllowedIPs = server VPN IP so client can:
        #   - Accept incoming packets from server (HAProxy reverse proxy)
        #   - Route responses back to server through the tunnel
        # NOT 0.0.0.0/0 to prevent client using VPN as internet proxy
        server_vpn_ip = settings.vpn_server_ip
        return f"""[Interface]
PrivateKey = {private_key}
Address = {address}/32
DNS = 1.1.1.1

[Peer]
PublicKey = {server_public_key}
Endpoint = {self.endpoint}
AllowedIPs = {server_vpn_ip}/32
PersistentKeepalive = 10
"""


wireguard_service = WireGuardService()
