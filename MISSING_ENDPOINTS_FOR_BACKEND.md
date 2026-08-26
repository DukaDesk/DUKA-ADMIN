# Missing Backend Endpoints for Admin Portal / Business Dashboard

**Target:** `https://duka-backend-production.up.railway.app`  
**Spec Reference:** `knowledge-base/backend/api-endpoints-reference.md` (Section 31: BFF - Business Dashboard)  
**Frontend Consumer:** `src/services/businessDashboard.js` (uses `/bff/admin/*` and `/admin/*` via `VITE_API_PREFIX=/api/v1`)

---

## ✅ Already Implemented (Verified Live)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/bff/admin/overview` | Platform overview stats |
| GET | `/api/v1/bff/admin/merchants` | Paginated merchant/tenant list |
| GET | `/api/v1/bff/admin/audit` | Recent audit logs |
| GET | `/api/v1/admin/stats` | Platform statistics |
| GET | `/api/v1/admin/merchants` | All tenants (admin view) |
| POST | `/api/v1/admin/merchants/{id}/approve` | Approve tenant |
| POST | `/api/v1/admin/merchants/{id}/suspend` | Suspend tenant |
| GET | `/api/v1/admin/settings` | Platform settings |
| GET | `/api/v1/admin/settings/{key}` | Single setting |
| PUT | `/api/v1/admin/settings/{key}` | Update setting |
| GET | `/api/v1/admin/feature-flags` | List feature flags |
| GET | `/api/v1/admin/feature-flags/{key}` | Get flag |
| PUT | `/api/v1/admin/feature-flags/{key}` | Update flag |
| DELETE | `/api/v1/admin/feature-flags/{key}` | Delete flag |
| GET | `/api/v1/admin/plans` | Subscription plans |
| GET | `/api/v1/admin/plans/{id}` | Plan detail |
| GET | `/api/v1/admin/subscriptions` | All subscriptions |
| PUT | `/api/v1/admin/subscriptions/{id}` | Update subscription |
| GET | `/api/v1/marketplace/listings/all` | All marketplace listings (admin) |
| POST | `/api/v1/auth/send-otp` | Send OTP |
| POST | `/api/v1/auth/verify-otp` | Verify OTP |

---

## 🔴 Critical — User Management (Required for UI-0003 UR-05)

| Method | Path | Description | Frontend Need |
|--------|------|-------------|---------------|
| GET | `/api/v1/admin/users` | List all users (paginated, filter: email, role, tenant, status) | UserManagement page |
| GET | `/api/v1/admin/users/{id}` | User detail: profile, roles, tenant memberships, last login | User detail modal |
| POST | `/api/v1/admin/users/{id}/invite` | Invite user to tenant (sends email with invite link) | "Invite User" button |
| POST | `/api/v1/admin/users/{id}/roles` | Assign/update roles for user in tenant(s) | Role dropdown in table |
| DELETE | `/api/v1/admin/users/{id}` | Remove user from platform | Delete action |
| GET | `/api/v1/admin/tenants/{tenantId}/users` | Users scoped to a tenant | Tenant detail → Users tab |

**Query params for list:** `page`, `limit`, `search`, `role`, `tenantId`, `status`, `sortBy`, `sortOrder`

---

## 🟡 High — Tenant Management & Settings (Required for UI-0003 UR-06)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/admin/tenants` | Create tenant (onboarding wizard) |
| GET | `/api/v1/admin/tenants/{id}` | Full tenant detail (config, subscription, features, owner) |
| PUT | `/api/v1/admin/tenants/{id}` | Update tenant (name, slug, status, config) |
| GET | `/api/v1/admin/tenants/{tenantId}/settings` | All settings for tenant (category filter) |
| PUT | `/api/v1/admin/tenants/{tenantId}/settings/{key}` | Update tenant-specific setting |

---

## 🟡 High — Analytics / Reports (Dashboard Home UR-04)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/bff/admin/analytics` | Dashboard analytics: revenue trend, user growth, order volume, GMV, active tenants |
| GET | `/api/v1/bff/admin/revenue` | Revenue report with filters: `dateFrom`, `dateTo`, `tenantId`, `groupBy` (day/week/month) |
| GET | `/api/v1/bff/admin/tenants/{tenantId}/analytics` | Per-tenant analytics (for drill-down) |

---

## 🟢 Medium — Enhanced Audit & Billing

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/admin/audit` | Platform audit: filter by `userId`, `action`, `tenantId`, `dateFrom`, `dateTo`, `resourceType` |
| POST | `/api/v1/admin/plans` | Create subscription plan |
| PUT | `/api/v1/admin/plans/{id}` | Update plan (price, features, limits, trial days) |
| DELETE | `/api/v1/admin/plans/{id}` | Delete plan (if no active subscriptions) |

---

## 📋 Frontend Integration Notes

- **Base URL:** `VITE_API_URL=https://duka-backend-production.up.railway.app`
- **Prefix:** `VITE_API_PREFIX=/api/v1` (handled in `src/services/api.js`)
- **Auth:** Bearer token in `Authorization` header (stored in `localStorage.admin_token`)
- **OTP Login Flow:** `POST /auth/send-otp` → `POST /auth/verify-otp` → returns `{ accessToken, refreshToken, user }`
- **Mock Fallback:** Frontend has `USE_MOCK=false` but mock handlers exist in `businessDashboard.js` for offline dev

---

## 🧪 Quick Smoke Test (Run After Implementation)

```bash
# Auth
curl -X POST https://duka-backend-production.up.railway.app/api/v1/auth/send-otp -d '{"email":"admin@test.com"}'
curl -X POST https://duka-backend-production.up.railway.app/api/v1/auth/verify-otp -d '{"email":"admin@test.com","code":"123456"}'

# User Management
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/admin/users
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/admin/users/1

# Tenant Management
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/admin/tenants/1
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/admin/tenants/1/settings

# Analytics
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/bff/admin/analytics
curl -H "Authorization: Bearer <TOKEN>" https://duka-backend-production.up.railway.app/api/v1/bff/admin/revenue
```

---

## 📌 Priority Order for Backend

1. **User Management** (6 endpoints) — blocks UserManagement page
2. **Tenant Detail/Settings** (4 endpoints) — blocks TenantSettings page
3. **Analytics/Revenue** (3 endpoints) — completes Dashboard home
4. **Enhanced Audit** (1 endpoint) — improves AuditLog page
5. **Plan CRUD** (3 endpoints) — enables SubscriptionManagement write actions