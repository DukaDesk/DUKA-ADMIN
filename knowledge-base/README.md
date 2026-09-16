# Admin Portal — Strict Knowledge-Base Alignment

This portal strictly implements the DukaDesk Knowledge Base (KB) located at `C:\Users\DELL\Documents\dukadesk-knowledge-base`.

## KB Sources Applied

- **Business Dashboard foundation**: `business-dashboard/AGENT_CONTEXT.md`, `ARCHITECTURE_ALIGNMENT.md`, `implementation/repositories/business-dashboard.md`
- **UI Shell & Navigation**: `engineering-specifications/specifications/ui/UI-0003.md` (Dashboard shell, sidebar, role-aware nav, summary cards, user management, settings), `ui-specifications/NAVIGATION_STANDARD.md`, `ui-specifications/ACCESSIBILITY_STANDARD.md`
- **Authorization & RBAC**: `engineering-specifications/specifications/security/SEC-0002.md`, `product-definition/07-permissions/ROLE_CATALOG.md`, `PERMISSION_CATALOG.md`
- **Tenant Lifecycle**: `engineering-specifications/specifications/features/FEAT-0002.md`, `engineering-specifications/specifications/api/API-0002.md`
- **Administration Domain**: `ARCHITECTURE/domains/administration.md` (Platform Configuration, Audit Logs, Monitoring, Feature Flags, System Health)

## KB Compliance Notes

- **Platform roles (strict)**: Super Admin (full `*`), Platform Operator (`tenant:manage`, `marketplace:manage`, `system:monitor`), Support Agent (`support:access`, read-only). See `ROLE_CATALOG.md` — Platform Roles table. Tenant roles (Organization Owner, Tenant Owner, etc.) are separate and not used here.
- **Permission format**: `<resource>:<action>` per `PERMISSION_CATALOG.md` (e.g., `tenant:suspend`, `marketplace:manage`, `system:monitor`). Implemented in `src/services/permissions.js:2` with KB alias tolerance for live backend.
- **Dashboard shell (UI-0003)**: `src/App.jsx:34` authenticated shell, `src/components/Layout/AdminSidebar.jsx:8` collapsible sidebar, `AdminTopbar.jsx` header, `AdminDashboard.jsx` home/summary, `PendingAdmins.jsx` user management, `Settings.jsx` tenant settings — all role-aware via `canAccessPage`.
- **Merchant is a separate portal** (Site Builder, `builder/`). Tenant App is mobile. This portal correlates merchant with tenant via BFF when linked (`businessDashboardApi.getMerchantEnriched` in `src/services/businessDashboard.js:31`, `MerchantManagement.jsx:124`, Dashboard tenant-colored charts in `AdminDashboard.jsx:83`). Good-practice: tenant data is color-coded teal vs merchant amber/blue.
- **Rejection comment**: `POST /admin/users/:id/reject` must include `{ reason, comment, rejectionReason }` — implemented in `businessDashboard.js:122` and `PendingAdmins.jsx:65`.
- **Charts**: Existing chart components kept per instruction (`RevenueChart`, `MerchantGrowthChart` in `AdminDashboard.jsx`), now with tenant-correlated second series.

## Live-Data Only

No mocks. All data via `VITE_API_URL` (`https://duka-backend-production.up.railway.app`) through `src/services/apiClient.ts:44` with retry, auth, and error propagation to UI.

## Previous Notes Applied

- "if theres need to colorate data from the tenant main app then it is in good practice we add" → tenant correlation and teal coloring implemented.
- "lets work with this roles first if theres any omission we wil revisit it" → KB 3 platform roles as strict base, legacy aliases kept as fallback for existing sessions.
- "yes use the chart components" → SVG chart components kept.
- "merchant is a separate portal" → reflected throughout merchant views and SlideOver.

## Verification (KB UI-0003 AC)

- [ ] Shell renders after login (E2E)
- [ ] Sidebar matches role (E2E — Super Admin sees all, Platform Operator sees tenants/marketplace/audit/subscriptions, Support Agent sees tenants/read-only)
- [ ] Admin can invite users (E2E — Settings → Admin Team → Invite)
- [ ] Admin can update tenant settings (E2E — Settings → Platform Config)

## Administration Domain Coverage

- Platform Configuration: `Settings.jsx` Platform Config tab + `getSettings`/`updateSetting`
- Audit Logs: `AuditLog.jsx` + `getAuditLog` (tamper-resistant, date range)
- Monitoring / System Health: `AdminDashboard.jsx` QuickStats + `getHealth`/`getInfraHealth`
- Feature Flags: `Settings.jsx` Features tab + `getFeatureFlags` lifecycle
- Platform Operations: `SubscriptionManagement.jsx`, `MarketplaceListings.jsx` moderation
