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
| Verification fixes | TESTING_STRATEGY | In Progress — eslint, vite-env, playwright | — |
| Error handling 403 + Modal | ERROR_HANDLING_STANDARD | In Progress | — |
| Tenant API alias `/tenants` | API-0002 | Planned | — |

## Completed Milestones

| Date | Milestone | Notes |
|------|-----------|-------|
| 2026-09-16 | Live-only BFF, no mocks | `businessDashboard.js` live-only, `USE_MOCK=false` |
| 2026-09-16 | Tenant correlation + charts | `AdminDashboard` tenant dashed teal series, `Merchant SlideOver` enriched |
| 2026-09-16 | Marketplace bulk + Settings invite real-data | `slugMap` bulk, `createUser` fallback |
| 2026-09-16 | Strict KB roles | Platform 3 roles, AuthContext heal, Topbar/Sidebar KB labels |
| 2026-09-16 | Knowledge-base/README mapping | Portal-specific KB traceability |

## Blockers

| Issue | Impact | Owner |
|-------|--------|-------|
| Playwright browsers not installed | `npm run test` fails headless-shell missing | — |
| ESLint config missing | `npm run lint` fails | — |
| 404 vs `/infra/health` live: `GET /health` public, `POST /infra/health` | `getInfraHealth` uses `/infra/status` workaround | backend |

## Next Up

- Add `/tenants` alias in `businessDashboard.js` for `API-0002` strictness
- Replace `prompt()` in `PendingAdmins` with `Modal` + form validation
- Add `Forbidden.jsx` 403 screen per `ERROR_HANDLING_STANDARD`
- Add breadcrumbs per `NAVIGATION_STANDARD` + `ui-specifications/NAVIGATION_STANDARD.md`
- Add missing Administration screens: Maintenance Windows, Platform Policy
- Map CSS vars to KB design tokens (`color-primary-500 #2563EB` etc.)
- Add `AGENT_CONTEXT` boot tests, role-based E2E (AC-01—AC-04), visual regression

