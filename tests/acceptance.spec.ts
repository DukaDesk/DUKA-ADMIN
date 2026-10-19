import { test, expect, ADMIN, seedSession } from "./utils/auth";

// P0 acceptance coverage (#24): operator-facing behaviours that must hold with
// live-only data — throttling feedback, mutation success/failure, role gating,
// and metric accuracy. Runs against the deterministic mock layer.

test.describe("Rate limiting", () => {
  test("throttled requests surface Retry-After guidance instead of retrying silently", async ({ authenticatedPage }) => {
    await authenticatedPage.route("**/api/v1/bff/admin/merchants**", (route) =>
      route.fulfill({
        status: 429,
        headers: {
          "content-type": "application/json",
          "retry-after": "30",
          "access-control-allow-origin": "*",
          "access-control-expose-headers": "retry-after",
        },
        body: JSON.stringify({ success: false, message: "ThrottlerException: Too Many Requests" }),
      })
    );

    await authenticatedPage.goto("/merchants");
    const alert = authenticatedPage.getByRole("alert");
    await expect(alert).toContainText("Too many requests", { timeout: 10000 });
    await expect(alert).toContainText("Retry in 30s");
  });
});

test.describe("Merchant mutations", () => {
  test("successful suspend confirms with a success toast", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByRole("button", { name: /Actions for Acme Store/ }).click();
    await authenticatedPage.getByRole("menuitem", { name: /Suspend merchant Acme Store/ }).click();

    const dialog = authenticatedPage.getByRole("dialog", { name: "Suspend merchant?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Suspend" }).click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Acme Store suspended" })).toBeVisible({ timeout: 10000 });
  });

  test("failed suspend surfaces an error toast and no success confirmation", async ({ authenticatedPage }) => {
    await authenticatedPage.route("**/api/v1/admin/merchants/*/suspend", (route) =>
      route.fulfill({
        status: 409,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ success: false, message: "Merchant cannot be suspended while under review" }),
      })
    );

    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");

    await authenticatedPage.getByRole("button", { name: /Actions for Acme Store/ }).click();
    await authenticatedPage.getByRole("menuitem", { name: /Suspend merchant Acme Store/ }).click();
    await authenticatedPage.getByRole("dialog", { name: "Suspend merchant?" }).getByRole("button", { name: "Suspend" }).click();

    await expect(authenticatedPage.getByRole("alert").filter({ hasText: "Merchant cannot be suspended while under review" })).toBeVisible({ timeout: 10000 });
    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Acme Store suspended" })).toHaveCount(0);
  });
});

test.describe("Role gating", () => {
  test("operations role gets app-review-only merchant actions", async ({ authenticatedPage }) => {
    await seedSession(authenticatedPage, { ...ADMIN, id: "ops-1", name: "Ops Operator", email: "ops@dukadesk.com", role: "operations" });

    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");

    await expect(authenticatedPage.getByRole("columnheader", { name: /App Review/ })).toBeVisible();

    await authenticatedPage.getByRole("button", { name: /Actions for/ }).first().click();
    const menu = authenticatedPage.getByRole("menu");
    await expect(menu.getByRole("menuitem")).toHaveCount(1);
    await expect(menu).toContainText("View Details");
    await expect(menu).not.toContainText("Suspend");
    await expect(menu).not.toContainText("Delete");
  });

  test("a role without page access is denied with 403", async ({ authenticatedPage }) => {
    await seedSession(authenticatedPage, { ...ADMIN, id: "guest-1", role: "operations" });

    await authenticatedPage.goto("/dashboard");
    await expect(authenticatedPage.getByRole("alert")).toContainText("Access denied", { timeout: 10000 });
  });
});

test.describe("Metric accuracy", () => {
  test("dashboard metrics reflect the live payload", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/dashboard");
    await authenticatedPage.waitForLoadState("networkidle");

    const metrics = authenticatedPage.getByRole("region", { name: "Key metrics" });
    await expect(metrics.locator("article", { hasText: "Total Merchants" })).toContainText("12");
    await expect(metrics.locator("article", { hasText: "Active Merchants" })).toContainText("8");
    await expect(metrics.locator("article", { hasText: "Pending Review" })).toContainText("3");
    await expect(metrics.locator("article", { hasText: "Total Subscriptions" })).toContainText("10");
  });
});
