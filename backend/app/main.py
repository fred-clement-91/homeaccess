import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.routers import admin, auth, billing, contact, tunnels, health
from app.services.haproxy import haproxy_daemon_loop

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: launch the HAProxy reload daemon
    daemon_task = asyncio.create_task(haproxy_daemon_loop())
    yield
    # Shutdown: cancel the daemon gracefully
    daemon_task.cancel()
    try:
        await daemon_task
    except asyncio.CancelledError:
        pass


app = FastAPI(title="HomeVPN", version="1.0.0", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "https://homeaccess.site",
        "https://www.homeaccess.site",
        "https://homeaccessadmin.domoteus.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(tunnels.router, prefix="/api/tunnels", tags=["tunnels"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(contact.router, prefix="/api/contact", tags=["contact"])
