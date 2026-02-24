import logging
import subprocess

from app.config import settings

logger = logging.getLogger(__name__)


class CertbotService:
    """Manages Let's Encrypt certificates for tunnel subdomains via HTTP-01 challenge."""

    def request_cert(self, subdomain: str) -> bool:
        """Request a Let's Encrypt certificate for {subdomain}.{domain}.

        Uses certbot standalone mode on the configured HTTP port.
        HAProxy routes /.well-known/acme-challenge/ to this port.
        """
        domain = f"{subdomain}.{settings.domain}"
        cert_dir = f"/etc/letsencrypt/live/{domain}"
        haproxy_cert = f"/etc/haproxy/certs/{domain}.pem"

        try:
            result = subprocess.run(
                [
                    "sudo", "certbot", "certonly",
                    "--standalone",
                    "--http-01-port", str(settings.certbot_http_port),
                    "-d", domain,
                    "--non-interactive",
                    "--agree-tos",
                    "--email", settings.certbot_email,
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )

            if result.returncode != 0:
                logger.error(f"Certbot failed for {domain}: {result.stderr}")
                return False

            # Combine key + fullchain for HAProxy
            subprocess.run(
                ["sudo", "bash", "-c",
                 f"cat {cert_dir}/privkey.pem {cert_dir}/fullchain.pem > {haproxy_cert}"],
                check=True,
                timeout=10,
            )

            # Reload HAProxy to pick up new cert
            subprocess.run(
                ["sudo", "systemctl", "reload", "haproxy"],
                check=True,
                timeout=10,
            )

            logger.info(f"Certificate obtained for {domain}")
            return True

        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError) as e:
            logger.error(f"Certificate request failed for {domain}: {e}")
            return False


certbot_service = CertbotService()
