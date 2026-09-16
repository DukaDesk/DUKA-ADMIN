# DukaDesk Admin Portal

**Knowledge Base Version:** 0.3.x (dukadesk-knowledge-base @ 2026-07-13)
**Engineering Specification Version:** UI-0003, SEC-0002, FEAT-0002, API-0002
**Status:** Live — `https://duka-backend-production.up.railway.app` / Vercel `duka-admin-477r.vercel.app`
**Owners:** Team H (Frontend) — see `CODEOWNERS`
**Supported Domains:** Administration (Platform Configuration, Audit Logs, Monitoring, Feature Flags, System Health) per `ARCHITECTURE/domains/administration.md`
**Supported Systems:** Web (React 18 + Vite 5)

Admin portal for DUKADESK platform operators. Strict KB alignment per `AGENT_CONTEXT.md` and `ARCHITECTURE_ALIGNMENT.md`.

## Quick Start

```bash
npm install
cp .env.example .env  # set VITE_API_URL=https://duka-backend-production.up.railway.app
npm run dev        # http://localhost:5173
npm run build
npm run typecheck
npm run lint
npm run test       # playwright (run npx playwright install first)
```

## Architecture

- Shell: `src/App.jsx` authenticated shell per `UI-0003` UR-01-03
- Business Dashboard: `src/pages/Dashboard/AdminDashboard.jsx` summary cards UR-04, live BFF `/bff/admin/*`
- Tenant/Merchant: `src/pages/Merchants/MerchantManagement.jsx` — merchant is separate Site Builder portal, correlated to Tenant App (mobile) via `businessDashboardApi.getMerchantEnriched`
- Marketplace, Subscriptions, Audit, Settings (Security/Notifications/Features/Platform/Team) per Administration domain
- RBAC: `src/services/permissions.js` strict SEC-0002 platform roles `Super Admin`, `Platform Operator`, `Support Agent` (plus legacy fallbacks)

## Repository Structure

```
Admin-portal/
├── AGENT_CONTEXT.md            # AI boot sequence, KB 0.3.x
├── ARCHITECTURE_ALIGNMENT.md   # KB + specs + deviations
├── PROGRESS.md                 # living status
├── CONTRIBUTING.md
├── CHANGELOG.md
├── CODEOWNERS
├── LICENSE
├── docs/README.md
├── src/README.md
├── tests/README.md
├── scripts/README.md
├── knowledge-base/README.md    # KB mapping for this portal
├── src/
│   ├── components/Layout/AdminSidebar.jsx (collapsible, badge polling)
│   ├── components/Layout/AdminTopbar.jsx (Menu + nav)
│   ├── components/Auth/AdminLogin.jsx (credentials + 6-digit OTP paste)
│   ├── pages/Dashboard/AdminDashboard.jsx (charts: RevenueChart/MerchantGrowthChart)
│   ├── services/businessDashboard.js (BFF + /admin + /bff/tenant)
│   └── services/permissions.js (SEC-0002)
└── tests/
```

## Knowledge Base

Target `C:\Users\DELL\Documents\dukadesk-knowledge-base` @ 2026-07-13:
- `business-dashboard/AGENT_CONTEXT.md`, `ARCHITECTURE_ALIGNMENT.md`
- `implementation/repositories/business-dashboard.md` (startup 7 of 9)
- `engineering-specifications/specifications/ui/UI-0003.md`, `api/API-0002.md`, `security/SEC-0002.md`, `features/FEAT-0002.md`
- `ARCHITECTURE/domains/administration.md`
- `product-definition/07-permissions/ROLE_CATALOG.md`, `PERMISSION_CATALOG.md`
- `ui-specifications/*` (DESIGN_SYSTEM_GUIDELINES, NAVIGATION_STANDARD, ERROR_HANDLING_STANDARD, ACCESSIBILITY_STANDARD)

See `AGENT_CONTEXT.md` and `ARCHITECTURE_ALIGNMENT.md` for full traceability.

## Contributing

See `CONTRIBUTING.md`. Reference specs by ID in commits (e.g., `UI-0003`, `SEC-0002`).

## License

See `LICENSE`.
