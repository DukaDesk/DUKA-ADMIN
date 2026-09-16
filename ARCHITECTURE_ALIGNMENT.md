# Admin Portal — Architecture Alignment

**Knowledge Base Version:** 0.3.x (2026-07-13)
**Engineering Specification Version:** UI-0003, SEC-0002, FEAT-0002, API-0002
**Last Updated:** 2026-09-16

---

## 1. Knowledge Base Version

Aligns with `C:\Users\DELL\Documents\dukadesk-knowledge-base` @ 2026-07-13, commit `business-dashboard` v0.3.x.

## 2. Referenced KB Documents

| KB-ID | Title | Relevance |
|-------|-------|-----------|
| KB-003 | Platform Philosophy | Foundation |
| KB-004 | Core Principles | Engineering rules |
| KB-141-B/C | Repository Structure / Required Documents | Repo structure standard |
| administration.md | Administration Domain | Owns Platform Config, Audit Logs, Monitoring, Feature Flags, System Health, Operations, Policies |
| ROLE_CATALOG.md | Role Catalog | Platform roles Super Admin/Platform Operator/Support Agent; tenant roles separate |
| PERMISSION_CATALOG.md | Permission Catalog | `resource:action` format, feeds Identity domain |
| UI-0003 | Business Dashboard Foundation and Shell | Shell, role-aware nav, summary cards, user manage, settings |
| SEC-0002 | Authorization and RBAC | Role-permission mapping, 403, UI hiding |
| FEAT-0002 | Tenant Lifecycle and Isolation | Create/suspend tenant, isolation, list my tenants |
| API-0002 | Tenant Management API | `/api/v1/tenants` CRUD + suspend |
| DESIGN_SYSTEM_GUIDELINES.md | Design Tokens | Colors, typography, spacing, radius, elevation |
| NAVIGATION_STANDARD.md | Navigation | Collapsible sidebar, breadcrumbs, deep links |
| ERROR_HANDLING_STANDARD.md | Error Handling | Visible/specific/actionable/recoverable, 4xx/5xx mapping |
| ACCESSIBILITY_STANDARD.md | Accessibility | WCAG 2.1 AA |

## 3. Referenced ADRs

| ADR | Title | Status |
|-----|-------|--------|
| ADR-001 | Authentication Protocol | To be created (KB placeholder) |
| ADR-002 | Multi-Tenant Data Isolation | To be created (KB placeholder) |
| ADR-003 | Web Rendering Strategy | To be created (KB placeholder) |

## 4. Referenced Engineering Specifications

| Specification | Version | Relevance |
|---------------|---------|-----------|
| UI-0003 | 2026-07-13 | Business Dashboard Foundation and Shell — implemented in `src/App.jsx`, `AdminSidebar.jsx`, `AdminDashboard.jsx`, `PendingAdmins.jsx`, `Settings.jsx` |
| SEC-0002 | 2026-07-13 | RBAC — implemented in `src/services/permissions.js`, `AuthContext.jsx` |
| FEAT-0002 | 2026-07-13 | Tenant Lifecycle — mapped to `GET /bff/admin/merchants`, `GET /admin/merchants/:id`, `POST /admin/merchants/:id/suspend` + enriched `getMerchantEnriched` |
| API-0002 | 2026-07-13 | Tenant Management API — alias `/tenants` added to `/admin/merchants` for KB compliance |

## 5. Architectural Constraints

1. Admin actions require `SEC-0002` permission checks (backend + UI).
2. Tenant isolation must be maintained (FEAT-0002 FR-03) — tenant data never leaks across merchants; correlation only when `tenantId` linked.
3. Merchant is a separate portal (`builder/`), Tenant App is mobile — correlation via BFF when linked (`/bff/tenant/:id/*`), color-coded teal vs amber.
4. Live data only — no `USE_MOCK`, no `mockCall`, errors propagate to `EnhancedRemoteTablePage` retry.
5. Role-based navigation hides items (`canAccessPage`) per `NAVIGATION_STANDARD` + `UI-0003` UR-03.
6. Design tokens via `var(--...)` per `DESIGN_SYSTEM_GUIDELINES` (mapped to `--amber`, `--blue`, `--teal` etc.).
7. Error handling per `ERROR_HANDLING_STANDARD` — 401→login, 403→Forbidden, 404→NotFound, retry affordance.

## 6. Known Deviations

| Deviation | Rationale | Review Date |
|-----------|-----------|-------------|
| Uses `GET /admin/merchants` + `GET /bff/admin/merchants` instead of `GET /api/v1/tenants` | Backend Railway currently exposes merchants under `/admin/merchants`; alias `GET /tenants` added in `businessDashboard.js` for KB compliance, but primary remains merchants for live backend | 2026-09-16 |
| Legacy role aliases (`admin`, `finance`, `investor`, `marketing`, `hr`, `moderator`, `analyst`) map to KB `platform_operator`/`support_agent` | Existing sessions (`getdukadesk`, `finance` investor) require healing; strict KB roles `Super Admin/Platform Operator/Support Agent` are primary, aliases deprecated | 2026-09-16 |
| Custom chart components (SVG) instead of `recharts` usage | User instruction “yes use the chart components” — keep `RevenueChart`/`MerchantGrowthChart` SVG, with tenant second series | 2026-09-16 |
| Message Bus / mobile manifest via `GET /bff/mobile/tenant/:slug/manifest` not in KB UI-0003 but needed for tenant correlation | Live swagger BFF Tenant Dashboard (`§29`) defines it; used in `getMerchantEnriched` | 2026-09-16 |
| Express backend vs NestJS KB framework | Practicality; `backend/railway.json` Nixpacks with `node src/index.js` per deployment | 2026-09-16 |

## 7. Compliance Notes

- **Verification:** `scripts/build`, `scripts/test`, `scripts/lint` per `business-dashboard/AGENT_CONTEXT.md:37` mapped to `npm run build/typecheck/lint/test`.
- **Repository targets:** `business-dashboard/` + `backend/` per specs — this repo covers `business-dashboard` responsibilities (tenant/user management, billing views, platform config, reports) plus platform ops (Administration domain) due to admin-portal scope.
- **Traceability:** Implementation in `src/services/businessDashboard.js` traces to `UI-0003` UR dependencies `FEAT-0001`, `FEAT-0002`, `SEC-0002`, `API-0002`.

## 8. Startup Order

`7 of 9` per `implementation/repositories/business-dashboard.md:7` — after `sdk/` published and UI specs ready. Exit criteria: admin can manage users/roles (`PendingAdmins.jsx`), update tenant settings (`Settings.jsx` Platform Config), commerce modules accessible (`MarketplaceListings.jsx`).

