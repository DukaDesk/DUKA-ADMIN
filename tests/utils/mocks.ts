import { Page, Route } from "@playwright/test";

// Deterministic API mocks so the Playwright suite runs without a live backend
// or OTP. Set E2E_LIVE=1 to fall back to the live-login fixture instead.

export const ADMIN = {
  id: "admin-1",
  email: "superadmin@dukadesk.com",
  name: "Super Admin",
  role: "super_admin",
  token: "test-token",
};

export const MERCHANTS = [
  {
    id: "m1",
    name: "Acme Store",
    email: "owner@acme.test",
    status: "published",
    verificationStatus: "verified",
    appStatus: "approved",
    plan: "professional",
    createdAt: "2026-01-05T00:00:00.000Z",
  },
  {
    id: "m2",
    name: "Beacon Books",
    email: "hello@beacon.test",
    status: "draft",
    verificationStatus: "pending",
    appStatus: "in_review",
    plan: "starter",
    createdAt: "2026-02-10T00:00:00.000Z",
  },
];

const USERS = [
  { id: "u1", email: "superadmin@dukadesk.com", firstName: "Super", lastName: "Admin", role: "super_admin", status: "ACTIVE" },
  { id: "u2", email: "ops@dukadesk.com", firstName: "Op", lastName: "Operator", role: "platform_operator", status: "ACTIVE" },
];

const OVERVIEW = { totalTenants: 12, publishedTenants: 8, inReviewTenants: 3, totalPlatformStaff: 4 };
const STATS = { totalSubscriptions: 10, activeSubscriptions: 7 };
const ANALYTICS = {
  gmv: 1234567,
  activeUsers: 240,
  activeTenants: 8,
  revenueTrend: [
    { period: "2026-10-01", revenue: 120000 },
    { period: "2026-10-02", revenue: 180000 },
    { period: "2026-10-03", revenue: 90000 },
  ],
  userGrowth: [
    { period: "Jan", count: 5 },
    { period: "Feb", count: 9 },
    { period: "Mar", count: 14 },
  ],
  orderVolume: [
    { period: "2026-10-01", count: 12 },
    { period: "2026-10-02", count: 20 },
  ],
};
const AUDIT = [
  { id: "e1", timestamp: "2026-10-18T10:00:00.000Z", adminEmail: "superadmin@dukadesk.com", action: "merchant.approve", targetType: "merchant", targetId: "m1", outcome: "success" },
  { id: "e2", timestamp: "2026-10-18T09:30:00.000Z", adminEmail: "ops@dukadesk.com", action: "login", targetType: "admin", targetId: "u2", outcome: "success" },
];
const SUBSCRIPTIONS = [
  { id: "s1", merchantId: "m1", merchantName: "Acme Store", plan: "professional", planId: "plan-pro", planName: "Professional", status: "active", amount: 25000, amountIsMajorUnits: true, currentPeriodEnd: "2026-11-05T00:00:00.000Z", createdAt: "2026-01-05T00:00:00.000Z" },
  { id: "s2", merchantId: "m2", merchantName: "Beacon Books", plan: "starter", planId: "plan-starter", planName: "Starter", status: "trialing", amount: 5000, amountIsMajorUnits: true, currentPeriodEnd: "2026-11-10T00:00:00.000Z", createdAt: "2026-02-10T00:00:00.000Z" },
];
const PLANS = [
  {
    id: "plan-pro",
    slug: "professional",
    name: "Professional",
    price: 25000,
    currency: "NGN",
    features: { customDomain: true, advancedAnalytics: true },
    limits: { maxProducts: 500, storageGb: 10 },
  },
  {
    id: "plan-starter",
    slug: "starter",
    name: "Starter",
    price: 5000,
    currency: "NGN",
    features: { customDomain: false },
    limits: { maxProducts: 50 },
  },
  {
    id: "plan-ent",
    slug: "enterprise",
    name: "Enterprise",
    price: 120000,
    currency: "NGN",
    features: { customDomain: true, advancedAnalytics: true, prioritySupport: true },
    limits: { maxProducts: 10000, storageGb: 500 },
  },
];
const LISTINGS = [
  { id: "l1", name: "Acme Loyalty", slug: "acme-loyalty", category: "marketing", merchantName: "Acme Store", status: "pending_review", downloads: 120, rating: 4.5, featured: false, createdAt: "2026-03-01T00:00:00.000Z" },
  { id: "l2", name: "Beacon Bookings", slug: "beacon-bookings", category: "booking", merchantName: "Beacon Books", status: "published", downloads: 540, rating: 4.8, featured: true, createdAt: "2026-02-15T00:00:00.000Z" },
];
const INTEGRATIONS = [
  { provider: "mailchimp", label: "Mailchimp", description: "Email marketing and audiences", oauthRequired: true },
  { provider: "sendgrid", label: "SendGrid", description: "Transactional email delivery", oauthRequired: false },
];
const SETTINGS = [
  { key: "two_factor_auth", value: true },
  { key: "auto_approve_apps", value: false },
  { key: "email_alerts", value: true },
  { key: "slack_alerts", value: false },
];
const FEATURE_FLAGS = [
  { key: "beta_builder", enabled: true, description: "Enable the beta site builder" },
  { key: "new_dashboard", enabled: false, description: "Roll out the refreshed dashboard" },
];

const jsonHeaders = { "content-type": "application/json" };

function reply(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, headers: jsonHeaders, body: JSON.stringify(body) });
}

function envelope(data: unknown, total?: number) {
  return total === undefined
    ? { success: true, message: "OK", data }
    : { success: true, message: "OK", data, total };
}

export async function seedSession(page: Page, admin: typeof ADMIN = ADMIN) {
  await page.addInitScript((value) => {
    localStorage.setItem("admin_token", value.token);
    localStorage.setItem("dukadesk_admin", JSON.stringify(value));
  }, admin);
}

export async function installApiMocks(page: Page) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const path = url.pathname.replace(/^.*\/api\/v1/, "");
    const q = url.searchParams;

    // Auth (enables the real login/OTP UI without a live backend)
    if (path === "/auth/login") {
      return reply(route, {
        success: true,
        data: { requiresOtp: true, challengeId: "challenge-1", user: { id: ADMIN.id, email: ADMIN.email, role: ADMIN.role } },
      });
    }
    if (path === "/auth/send-otp") return reply(route, envelope({ message: "OTP sent" }));
    if (path === "/auth/verify-admin-login") {
      return reply(route, envelope({ accessToken: "verified-access-token", refreshToken: "verified-refresh-token", user: { id: ADMIN.id, email: ADMIN.email, role: ADMIN.role } }));
    }
    if (path === "/auth/refresh") {
      return reply(route, envelope({ accessToken: "refreshed-access-token", refreshToken: "refreshed-refresh-token", user: { id: ADMIN.id, email: ADMIN.email, role: ADMIN.role } }));
    }
    if (path === "/auth/verify-password") {
      const body = (request.postDataJSON() || {}) as { password?: string };
      if (body.password === "AdminPass123!") return reply(route, envelope({ verified: true }));
      return reply(route, { success: false, errors: ["Invalid password"] }, 401);
    }

    // Dashboard / BFF
    if (path === "/bff/admin/overview") return reply(route, envelope(OVERVIEW));
    if (path === "/bff/admin/analytics") return reply(route, envelope(ANALYTICS));
    if (path === "/bff/admin/revenue") return reply(route, envelope({ revenue: 1234567, transactionCount: 321 }));
    if (path === "/bff/admin/audit") return reply(route, envelope(AUDIT, AUDIT.length));

    // Merchants (bff + admin)
    if (path === "/bff/admin/merchants" || path === "/admin/merchants") {
      if (method !== "GET") return reply(route, envelope({}));
      let list = MERCHANTS.slice();
      const search = (q.get("search") || "").toLowerCase();
      const status = q.get("status");
      const plan = q.get("plan");
      const appStatus = q.get("appStatus");
      const verification = q.get("verification");
      if (search) list = list.filter((m) => m.name.toLowerCase().includes(search) || m.email.toLowerCase().includes(search));
      if (status) list = list.filter((m) => m.status === status);
      if (plan) list = list.filter((m) => m.plan === plan);
      if (appStatus) list = list.filter((m) => m.appStatus === appStatus);
      if (verification) list = list.filter((m) => m.verificationStatus === verification);
      const total = list.length;
      const limit = Number(q.get("limit") || 10) || 10;
      const currentPage = Number(q.get("page") || 1) || 1;
      const start = (currentPage - 1) * limit;
      return reply(route, envelope(list.slice(start, start + limit), total));
    }

    // Users
    if (path === "/admin/users") {
      let users = USERS.slice();
      const role = q.get("role");
      if (role) users = users.filter((u) => u.role === role);
      return reply(route, envelope({ users, total: users.length }));
    }
    if (/^\/admin\/users\/[^/]+$/.test(path)) return reply(route, envelope(USERS[0]));

    // Settings / feature flags / plans / announcements / maintenance / policies / invites
    if (path === "/admin/settings") return reply(route, envelope(SETTINGS));
    if (/^\/admin\/settings\/[^/]+$/.test(path)) return reply(route, envelope({}));
    if (path === "/admin/feature-flags") return reply(route, envelope(FEATURE_FLAGS));
    if (/^\/admin\/feature-flags\/[^/]+$/.test(path)) return reply(route, envelope({}));
    if (path === "/admin/plans") return reply(route, envelope(PLANS));
    if (path === "/admin/announcements") return reply(route, envelope([], 0));
    if (path.startsWith("/admin/announcements/")) return reply(route, envelope({}));
    if (path === "/admin/maintenance") return reply(route, envelope([], 0));
    if (path === "/admin/policies") return reply(route, envelope([], 0));
    if (path.startsWith("/admin/policies/")) return reply(route, envelope({}));
    if (path === "/admin/invites") return reply(route, envelope([]));
    if (path.startsWith("/admin/invites/")) return reply(route, envelope({}));
    if (path === "/admin/subscriptions") return reply(route, envelope(SUBSCRIPTIONS, SUBSCRIPTIONS.length));
    if (/^\/admin\/subscriptions\/[^/]+$/.test(path)) return reply(route, envelope(SUBSCRIPTIONS[0]));
    if (/^\/admin\/quotas\/[^/]+$/.test(path)) return reply(route, envelope({ quota: { storageLimitMb: 1024, storageUsedMb: 128 } }));
    if (path === "/admin/stats") return reply(route, envelope(STATS));
    if (path === "/admin/support-tickets") return reply(route, envelope([], 0));
    if (/^\/admin\/support-tickets\/[^/]+$/.test(path)) return reply(route, envelope({}));
    if (path.startsWith("/admin/reports/")) return reply(route, envelope({ filename: "export.csv", rows: 0, csv: "" }));

    // Merchant review sub-resources
    if (/^\/admin\/merchants\/[^/]+\/preview$/.test(path)) {
      const id = path.split("/")[3];
      const merchant = MERCHANTS.find((m) => m.id === id) || MERCHANTS[0];
      return reply(route, envelope({
        source: "review",
        releaseVersion: 3,
        app: { name: `${merchant.name} App` },
        theme: { colors: { primary: "#F4A026", background: "#FCF8FA", textPrimary: "#0F0F1A" } },
        pages: [
          { id: "home", slug: "home", name: "Home", isHome: true, sections: [{ id: "hero-1", type: "hero", props: { title: "Welcome" } }] },
          { id: "menu", slug: "menu", name: "Menu", sections: [{ id: "text-1", type: "text", props: { text: "Browse our picks" } }] },
        ],
      }));
    }
    if (/^\/admin\/merchants\/[^/]+\/review$/.test(path)) {
      const id = path.split("/")[3];
      const merchant = MERCHANTS.find((m) => m.id === id) || MERCHANTS[0];
      return reply(route, envelope({
        tenant: { id: merchant.id, name: merchant.name, verificationStatus: merchant.verificationStatus, appStatus: merchant.appStatus },
        quota: { used: 10, limit: 1000 },
        compliance: [],
        releases: [],
        draftPages: [],
        app: { name: `${merchant.name} App` },
      }));
    }
    if (/^\/admin\/merchants\/[^/]+$/.test(path)) {
      const id = path.split("/").pop();
      const merchant = MERCHANTS.find((m) => m.id === id) || MERCHANTS[0];
      return reply(route, envelope(merchant));
    }
    if (path.startsWith("/admin/merchants/")) return reply(route, envelope({}));

    // Marketplace
    if (path === "/marketplace/listings/all") {
      if (method !== "GET") return reply(route, envelope({}));
      const search = (q.get("search") || "").toLowerCase();
      const status = q.get("status");
      const category = q.get("category");
      const sort = q.get("sort") || "createdAt";
      const direction = q.get("order") === "asc" ? 1 : -1;
      let list = LISTINGS.slice();
      if (search) list = list.filter((l) => l.name.toLowerCase().includes(search) || l.merchantName.toLowerCase().includes(search));
      if (status) list = list.filter((l) => l.status === status);
      if (category) list = list.filter((l) => l.category === category);
      list.sort((a, b) => (a[sort] > b[sort] ? 1 : a[sort] < b[sort] ? -1 : 0) * direction);
      const total = list.length;
      const limit = Number(q.get("limit") || 10) || 10;
      const currentPage = Number(q.get("page") || 1) || 1;
      const start = (currentPage - 1) * limit;
      return reply(route, envelope(list.slice(start, start + limit), total));
    }
    if (path === "/marketplace/stats") return reply(route, envelope({ totalListings: LISTINGS.length, pending: LISTINGS.filter((l) => l.status === "pending_review").length }));
    const listingMatch = path.match(/^\/marketplace\/listings\/([^/]+)$/);
    if (listingMatch) {
      const listing = LISTINGS.find((l) => l.slug === decodeURIComponent(listingMatch[1])) || LISTINGS[0];
      if (method === "DELETE") return reply(route, envelope({}));
      if (method === "PUT") return reply(route, envelope({ ...listing, ...(request.postDataJSON() || {}) }));
      return reply(route, envelope(listing));
    }

    // Health / infrastructure
    if (path === "/health") return reply(route, envelope({ status: "ok", checks: { database: "ok" }, uptime: 90061 }));
    if (path === "/infra/overview") return reply(route, envelope({ deploymentCount: 3, backupCount: 2, healthCheckCount: 5, uptime: 99.9 }));
    if (path === "/infra/status") return reply(route, envelope({ status: "healthy", uptime: 99.9 }));
    if (path === "/infra/environments") return reply(route, envelope([], 0));
    if (path === "/infra/health/history") return reply(route, envelope([]));

    // Marketing
    if (path === "/app/integrations/available") return reply(route, envelope(INTEGRATIONS));

    if (method === "GET") return reply(route, envelope([], 0));
    return reply(route, envelope({}));
  });
}
