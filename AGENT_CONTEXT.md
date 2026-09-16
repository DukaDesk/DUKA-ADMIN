# Admin Portal — Agent Context

**Knowledge Base Version:** 0.3.x (2026-07-13)
**Engineering Specification Version:** UI-0003 v0.1, SEC-0002, FEAT-0002, API-0002
**Last Updated:** 2026-09-16

---

## Repository Purpose

Platform administration portal for DUKADESK — operates, configures, monitors and governs the platform per `ARCHITECTURE/domains/administration.md`. Business Dashboard shell for platform roles `Super Admin`, `Platform Operator`, `Support Agent`.

## Supported Domains

Administration (Platform Configuration, Audit Logs, Monitoring, Feature Flags, System Health, Operational Governance) — consumes Tenant Management (`FEAT-0002`, `API-0002`), Identity (`SEC-0002`), Commerce, Builder.

## Supported Systems

Web (React 18 + Vite 5, React Router 6, lucide-react, recharts), Vercel deployment, Railway backend `https://duka-backend-production.up.railway.app`.

## Knowledge Base Version

Aligns with `C:\Users\DELL\Documents\dukadesk-knowledge-base` @ 2026-07-13 and Engineering Spec version UI-0003/SEC-0002/FEAT-0002/API-0002. See `ARCHITECTURE_ALIGNMENT.md` for deviations.

## Required Documents

Read before writing code:

1. `README.md`
2. `AGENT_CONTEXT.md` (this file)
3. `ARCHITECTURE_ALIGNMENT.md`
4. `PROGRESS.md`
5. `CONTRIBUTING.md`
6. `ENGINEERING_STANDARDS.md` (in KB)
7. `GLOSSARY.md` (in KB)
8. `ARCHITECTURE/domains/administration.md`
9. `engineering-specifications/specifications/ui/UI-0003.md`
10. `engineering-specifications/specifications/security/SEC-0002.md`, `features/FEAT-0002.md`, `api/API-0002.md`
11. `product-definition/07-permissions/ROLE_CATALOG.md`, `PERMISSION_CATALOG.md`
12. `ui-specifications/*` (DESIGN_SYSTEM_GUIDELINES, NAVIGATION_STANDARD, ERROR_HANDLING_STANDARD)
13. `knowledge-base/README.md` in this repo (portal-specific mapping)

## Repository Rules

1. Read required docs before writing code.
2. Treat KB as authoritative — extend patterns, do not replace silently.
3. Use terminology as defined in `GLOSSARY.md` (Merchant = Site Builder portal, Tenant = Mobile app).
4. Live data only — no mocks (`USE_MOCK` removed, `businessDashboard.js` live-only, errors propagate).
5. Merchant is a separate portal (`builder/`) — correlate tenant via BFF when linked (teal vs amber coloring).
6. Rejection `POST /admin/users/:id/reject` must include `{reason,comment,rejectionReason}`.
7. Keep chart components (`RevenueChart`, `MerchantGrowthChart` in `AdminDashboard.jsx`).
8. Update `PROGRESS.md` when status changes; write tests for new capabilities.

## Coding Standards

- Follow `NAMING_STANDARDS.md` (kebab/camel per language), `ENGINEERING_STANDARDS.md`
- Language: JS/JSX + TS (`apiClient.ts`), React 18, Vite 5, lucide-react icons only (no emoji), Tailwind/lucide token usage via `var(--...)`
- Follow `ui-specifications/ERROR_HANDLING_STANDARD.md` (403 Forbidden, retry, actionable messages)
- Follow `ui-specifications/ACCESSIBILITY_STANDARD.md` (WCAG 2.1 AA: `aria-*`, keyboard, breadcrumbs)

## Forbidden Actions

- Do not modify accepted ADRs.
- Do not introduce undocumented concepts or hardcode secrets (use `.env`).
- Do not commit `.env` (gitignored).
- Do not bypass KB for convenience (e.g., adding mock fallback).
- Do not duplicate platform capabilities.
- Do not make breaking changes without ADR.

## Boot Sequence

```
Initialize Workspace
  → Read AGENT_CONTEXT.md
  → Read README.md
  → Read ARCHITECTURE_ALIGNMENT.md
  → Read PROGRESS.md
  → Read KB domain `administration.md`
  → Read UI-0003, SEC-0002, FEAT-0002, API-0002
  → Read ROLE_CATALOG, PERMISSION_CATALOG
  → Read ui-specifications
  → Determine Task
  → Perform Task
  → Run Self Review (build, lint, typecheck)
  → Update PROGRESS.md
  → Generate Summary
```

## Cross-Repository Context

- **Upstream dependencies:** `backend/` (BFF `/bff/admin/*`, `/admin/*`, `/bff/tenant/:id/*`), `sdk/`
- **Downstream consumers:** Vercel `duka-admin-477r.vercel.app`
- **Related repositories:** `dukadesk-knowledge-base` (source), `dukadesk-website`, `tenant-dashboard/`, `builder/`, `mobile/`
