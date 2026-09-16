# Changelog

All notable changes to the Admin Portal follow `Keep a Changelog` and `VERSIONING_STANDARD.md`.

## [Unreleased]

### Added
- Strict KB alignment (`knowledge-base/README.md`, `AGENT_CONTEXT.md`, `ARCHITECTURE_ALIGNMENT.md` updated to KB 0.3.x, SEC-0002/ROLE_CATALOG)
- Tenant correlation via `getMerchantEnriched` (BFF tenant summary/analytics/manifest + quota) with teal vs amber coloring per `FEAT-0002`
- Dashboard tenant second series in `RevenueChart`/`MerchantGrowthChart`
- `createUser` (`POST /admin/users`) fallback for Settings invite
- `slugMap` for Marketplace bulk actions (real `id→slug`)

### Changed
- RBAC strict: `super_admin` / `platform_operator` / `support_agent` primary, legacy aliases mapped (`permissions.js`, `AuthContext.jsx` heal, Topbar/Sidebar KB labels)
- `rejectUser` now sends `{reason,comment,rejectionReason}` (PendingAdmins prompt)
- Settings `ROLE_OPTIONS` → KB `platform_operator/support_agent/super_admin`
- `MerchantManagement` SlideOver enriched with separate portal badge + tenant linked state

### Fixed
- `UserStatus` `PENDING` enum case-insensitive, `take/skip` `Number()` conversion, `POST /admin/users/:id/approve`+`/reject`, `DELETE /admin/merchants/:id`
- CORS `CORS_ORIGIN` comma-list, OTP paste `one-time-code`, `Retry` vs empty message

## [1.0.0] - 2026-09-16
- Initial shell per `UI-0003` UR-01-06, Administration domain audit/logs/health/feature-flags/platform operations
- Live Railway backend `https://duka-backend-production.up.railway.app`

