# Admin Portal — Progress

**Knowledge Base Version:** 0.3.x
**Last Updated:** 2026-09-16

---

## Active Work

| Task | Specification | Status | Owner |
|------|---------------|--------|-------|
| Reject comment payload | UI-0003, ERROR_HANDLING | Done — `rejectUser` sends `{reason,comment,rejectionReason}` | — |
| Merchant separate portal + tenant correlation | FEAT-0002, ADMINISTRATION | Done — `getMerchantEnriched`, teal/amber charts | — |
| Strict KB roles | SEC-0002, ROLE_CATALOG | Done — `super_admin/platform_operator/support_agent` strict + legacy fallback | — |
| KB-required docs | KB-141-B/C | Done — AGENT_CONTEXT, ARCHITECTURE_ALIGNMENT, PROGRESS, CONTRIBUTING, CHANGELOG, CODEOWNERS, LICENSE | — |
| Verification & Quality Gates | TESTING_STRATEGY | Done — eslint 0 warnings, tsc 0 errors, playwright green | — |
| Error handling 403 + Modal | ERROR_HANDLING_STANDARD | Done — `Forbidden.jsx`, `Modal` validation in `PendingAdmins` | — |
| Tenant API alias `/tenants` | API-0002 | Done — `getTenantsApi`, `createTenantApi`, `suspendTenantApi` added | — |
| Platform Analytics (P2) | FR-004, PRD §19 | Done — Timeframe range controls (7d/30d/90d/1y), GMV/AOV, user growth chart | — |
| Operational latency benchmark | NFR-01/02/03/11/13/14 | Done — `scripts/measure-api-latency.mjs` (`npm run perf:latency`) | — |

## Completed Milestones

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-10-28 | PRD Completion & Performance Validation | Platform analytics (timeframes, GMV, user growth), `scripts/measure-api-latency.mjs`, `/tenants` API-0002 aliases, bundle budgets (238 kB JS / 16.7 kB CSS gzip) verified |
| 2026-09-16 | Live-only BFF, no mocks | `businessDashboard.js` live-only, `USE_MOCK=false` |
| 2026-09-16 | Tenant correlation + charts | `AdminDashboard` tenant dashed teal series, `Merchant SlideOver` enriched |
| 2026-09-16 | Marketplace bulk + Settings invite real-data | `slugMap` bulk, `createUser` fallback |
| 2026-09-16 | Strict KB roles | Platform 3 roles, AuthContext heal, Topbar/Sidebar KB labels |
| 2026-09-16 | Knowledge-base/README mapping | Portal-specific KB traceability |

## Blockers

| Issue | Impact | Owner |
|-------|--------|-------|
| Live backend `/health` 404 | Public root health check returns 404; `/api/v1/health` works | backend |

## Next Up

- Map CSS vars to KB design tokens (`color-primary-500 #2563EB` etc.)
- Run periodic automated live latency checks via CI schedule


