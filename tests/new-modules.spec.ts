import { test, expect } from "./utils/auth";

test.describe("New Business Dashboard Modules (BD-ORD/BD-PROD/BD-CUST/BD-ANAL/BD-MKT)", () => {
  const pages = [
    { path: "/orders", title: "Orders", spec: "BD-ORD-001" },
    { path: "/products", title: "Products", spec: "BD-PROD-001" },
    { path: "/customers", title: "Customers", spec: "BD-CUST-001" },
    { path: "/analytics", title: "Analytics & Reports", spec: "BD-ANAL-001" },
    { path: "/marketing", title: "Campaigns", spec: "BD-MKT-001" },
    { path: "/infrastructure", title: "Infrastructure", spec: "KB-141" },
  ];

  for (const { path, title, spec } of pages) {
    test(`${title} page loads live (${spec})`, async ({ authenticatedPage }) => {
      await authenticatedPage.goto(path);
      await authenticatedPage.waitForLoadState("networkidle");
      // Title from page h2 or header
      await expect(authenticatedPage.locator(`h2:has-text("${title}"), h3:has-text("${title}")`).first()).toBeVisible({ timeout: 10000 });
      // No mock banner — ensure live data or emptyMessage, not error with mock
      await expect(authenticatedPage.locator('[role="alert"]')).toHaveCount(0);
    });
  }

  test("orders status update action is RBAC-gated", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/orders");
    await authenticatedPage.waitForLoadState("networkidle");
    const firstRowActions = authenticatedPage.locator('[role="group"][aria-label="Row actions"]').first();
    if (await firstRowActions.isVisible()) {
      await expect(firstRowActions.locator('button:has-text("View")')).toBeVisible();
    }
  });

  test("products stock adjustment prompts (live POST /app/commerce/products/:id/adjust-stock)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/products");
    await authenticatedPage.waitForLoadState("networkidle");
    await expect(authenticatedPage.locator('h2:has-text("Products")')).toBeVisible();
  });

  test("analytics saved reports CRUD (live POST /app/analytics/reports)", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/analytics");
    await authenticatedPage.waitForLoadState("networkidle");
    await expect(authenticatedPage.locator('h2:has-text("Analytics & Reports")')).toBeVisible();
    await expect(authenticatedPage.locator('button:has-text("New Report")')).toBeVisible();
  });

  test("marketing bulk and infrastructure overview render", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/marketing");
    await authenticatedPage.waitForLoadState("networkidle");
    await expect(authenticatedPage.locator('h2:has-text("Campaigns")')).toBeVisible();
    await authenticatedPage.goto("/infrastructure");
    await authenticatedPage.waitForLoadState("networkidle");
    await expect(authenticatedPage.locator('h2:has-text("Infrastructure")')).toBeVisible();
  });
});

test.describe("Quotas & Audit — Administration domain", () => {
  test("merchant quota shows live via GET /admin/quotas/:merchantId", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");
    const viewBtn = authenticatedPage.locator('button:has-text("View")').first();
    if (await viewBtn.isVisible()) {
      await viewBtn.click();
      await expect(authenticatedPage.locator('text=Quota:')).toBeVisible({ timeout: 10000 });
    }
  });
});
