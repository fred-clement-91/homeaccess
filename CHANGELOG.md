# Changelog

## 2026-02-25

### Added: Beta tester account flag
- Added `is_beta_tester` boolean field to User model (default: false)
- Alembic migration `002_add_is_beta_tester`
- Admin can toggle "Compte gratuit" checkbox per user in admin panel
- Badge "Compte gratuit beta-testeur" displayed on user dashboard when enabled
- Badge "Beta" shown next to user in admin user list

### Files modified
- `backend/app/models/user.py` - Added `is_beta_tester` column
- `backend/alembic/versions/002_add_is_beta_tester.py` - New migration
- `backend/app/schemas/user.py` - Added to `UserProfile`, `AdminUserResponse`, `AdminUserUpdate`
- `backend/app/routers/auth.py` - Added `is_beta_tester` to `/me` response
- `backend/app/routers/admin.py` - Handle `is_beta_tester` in PATCH + list responses
- `frontend/src/types/index.ts` - Added to `User` and `AdminUser` interfaces
- `frontend/src/pages/DashboardPage.tsx` - Display beta tester badge
- `frontend/src/pages/AdminPage.tsx` - Checkbox + badge in admin panel

---

## 2026-02-24

### Added: QR code and documentation updates
- WireGuard QR code on tunnel cards
- Welcome email with WireGuard config on tunnel creation
- Documentation page for authenticated users (MikroTik, HTTP-only ports, WG router)

### Added: Core features
- Device IP (10.100.0.0/16) per tunnel for LAN device routing
- User registration with email verification
- JWT authentication
- Tunnel CRUD with WireGuard peer management
- Admin panel (users, tunnels, activity log)
- HAProxy auto-configuration
- Contact form
