from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql+asyncpg://homevpn:secret@db:5432/homevpn"
    jwt_secret: str = "changeme"
    jwt_algorithm: str = "HS256"
    jwt_expiration_minutes: int = 1440
    fernet_key: str = "changeme"
    wireguard_endpoint: str = "vpn.homeaccess.site:51820"
    wireguard_interface: str = "wg1"
    wireguard_config_path: str = "/etc/wireguard/wg1.conf"
    haproxy_backends_path: str = "/etc/haproxy/homevpn-backends.cfg"
    haproxy_map_path: str = "/etc/haproxy/homevpn-subdomains.map"
    vpn_subnet: str = "172.16.0.0/16"
    vpn_server_ip: str = "172.16.0.1"
    domain: str = "homeaccess.site"
    max_tunnels_per_user: int = 5
    certbot_http_port: int = 8402
    certbot_email: str = "admin@homeaccess.site"

    # Contact
    contact_email: str = ""

    # SMTP
    smtp_host: str = "localhost"
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    smtp_from: str = "noreply@homeaccess.site"
    smtp_tls: bool = True

    class Config:
        env_file = ".env"


settings = Settings()
