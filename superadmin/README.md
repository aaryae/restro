# Serve Superadmin

Platform control panel for multi-tenant cafes (`admin.servecafe.app`).

## Run

```bash
# Backend (from nirvana-restro/backend)
# Required in .env:
#   PLATFORM_JWT_SECRET=<openssl rand -hex 32>
#   PLATFORM_ADMIN_USERNAME=technirvana
#   PLATFORM_ADMIN_PASSWORD=<strong password, min 10 chars>
npm run migrate:control
npm run seed:platform
npm run serve

# Superadmin UI
cd ../superadmin
npm install
npm run dev
```

UI: **http://localhost:7002**

### Login
Use `PLATFORM_ADMIN_USERNAME` / `PLATFORM_ADMIN_PASSWORD` from backend `.env`.
There is **no** default password — `npm run seed:platform` refuses to run without env.

## Stack
- Vite + React + TypeScript
- React Router (lazy routes + Suspense)
- TanStack Query
- Tailwind CSS

## Structure
```
src/
  api/           platform client
  auth/          AuthProvider + RequireAuth + RequirePermission
  app/           App + router (lazy pages)
  layout/        sidebar / topbar
  pages/         dashboard, cafes, audit, settings…
  components/    table, badges, loading
```

## APIs used
- `POST /api/v1/platform/login`
- `GET  /api/v1/platform/stats|cafes|audit-logs`
- `POST /api/v1/platform/cafes/:id/{activate,suspend,extend-trial,impersonate}`
