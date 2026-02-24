import ipaddress

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.tunnel import Tunnel


class IPAllocator:
    def __init__(self):
        self.network = ipaddress.IPv4Network(settings.vpn_subnet)
        self.server_ip = ipaddress.IPv4Address(settings.vpn_server_ip)

    async def allocate_next_ip(self, db: AsyncSession) -> str:
        result = await db.execute(select(Tunnel.vpn_ip))
        allocated = {str(row[0]) for row in result.fetchall()}

        for host in self.network.hosts():
            if host == self.server_ip:
                continue
            ip_str = str(host)
            if ip_str not in allocated:
                return ip_str

        raise RuntimeError("IP address pool exhausted")


ip_allocator = IPAllocator()
