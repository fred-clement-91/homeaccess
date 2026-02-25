# HomeVPN - Project Guidelines

## Architecture
- **Backend**: FastAPI (Python 3.12) with async SQLAlchemy + PostgreSQL (asyncpg)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4
- **Infrastructure**: Docker Compose (backend, frontend, postgres, wireguard, haproxy)
- **Auth**: JWT tokens (python-jose), bcrypt passwords, email verification codes

## Project Structure
```
backend/
  app/
    models/        # SQLAlchemy models (user.py, tunnel.py, activity_log.py)
    schemas/       # Pydantic schemas (user.py, tunnel.py)
    routers/       # FastAPI routes (auth.py, admin.py, tunnels.py, contact.py, health.py)
    services/      # Business logic (wireguard.py, haproxy.py, email.py, auth.py, ip_allocator.py, activity.py)
    config.py      # Pydantic settings from .env
    database.py    # Async SQLAlchemy engine + session
    dependencies.py # get_current_user, get_current_admin
    main.py        # FastAPI app factory
  alembic/         # DB migrations (sequential: 001, 002, ...)
frontend/
  src/
    pages/         # DashboardPage, AdminPage, etc.
    components/    # TunnelCard, CreateTunnelModal, etc.
    contexts/      # AuthContext (user state, JWT in localStorage)
    api/client.ts  # Axios instance with auth interceptor
    types/index.ts # TypeScript interfaces (User, Tunnel, AdminUser, etc.)
```

## Key Conventions
- Language: French for UI text, English for code (variable names, comments)
- Alembic migrations: sequential numeric IDs (001, 002, ...)
- Admin routes: `/api/admin/*`, protected by `get_current_admin` dependency
- All API calls go through the Axios client with auto-auth Bearer token
- Tailwind dark theme: gray-900 backgrounds, indigo/purple gradients for actions
- Schemas: `UserProfile` for /me endpoint, `AdminUserResponse` for admin views, `AdminUserUpdate` for PATCH

## Commands
```bash
# Backend
cd backend && alembic upgrade head    # Run migrations
cd backend && uvicorn app.main:app    # Dev server

# Frontend
cd frontend && npm run dev            # Dev server
cd frontend && npm run build          # Production build

# Docker
docker compose up -d                  # Start all services
docker compose exec backend alembic upgrade head  # Migrate in Docker
```

## Important Notes
- When adding a field to User model, update: model, migration, UserProfile schema, AdminUserResponse schema, AdminUserUpdate schema, /me endpoint, admin list_users, admin update_user, frontend types (User + AdminUser), and relevant UI
- WireGuard peers are managed via subprocess calls (wg set/show)
- HAProxy config is regenerated on tunnel create/delete/toggle
- Activity logging is fire-and-forget (separate DB session)
