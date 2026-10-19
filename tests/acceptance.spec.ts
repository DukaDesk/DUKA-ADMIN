import { test, expect, ADMIN, seedSession } from "./utils/auth";

// P0 acceptance coverage (#24): operator-facing behaviours that must hold with
// live-only data — throttling feedback, mutation success/failure, role gating,
// and metric accuracy. Runs against the deterministic mock layer.
//
// A generous per-test timeout keeps cold Vite compilation from flaking the first
// test locally; CI serves a prebuilt artifact, so it completes well within this.
test.describe.configure({ timeout: 60_000 });

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
    await expect(authenticatedPage.getByRole("button", { name: /Actions for Acme Store/ })).toBeVisible({ timeout: 10000 });

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
    await expect(authenticatedPage.getByRole("button", { name: /Actions for Acme Store/ })).toBeVisible({ timeout: 10000 });

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
    await expect(authenticatedPage.getByRole("columnheader", { name: /App Review/ })).toBeVisible({ timeout: 10000 });

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

    const metrics = authenticatedPage.getByRole("region", { name: "Key metrics" });
    await expect(metrics.locator("article", { hasText: "Total Merchants" })).toContainText("12");
    await expect(metrics.locator("article", { hasText: "Active Merchants" })).toContainText("8");
    await expect(metrics.locator("article", { hasText: "Pending Review" })).toContainText("3");
    await expect(metrics.locator("article", { hasText: "Total Subscriptions" })).toContainText("10");
  });
});

test.describe("Session lifecycle", () => {
  test("a revoked session returns the operator to sign-in", async ({ authenticatedPage }) => {
    await authenticatedPage.route("**/api/v1/auth/refresh", (route) =>
      route.fulfill({
        status: 401,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ success: false, message: "Unauthorized" }),
      })
    );
    await authenticatedPage.route("**/api/v1/bff/admin/overview**", (route) =>
      route.fulfill({
        status: 401,
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ success: false, message: "Unauthorized" }),
      })
    );

    await authenticatedPage.goto("/dashboard");
    await expect(authenticatedPage.getByRole("heading", { name: "Admin Sign In" })).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Cross-merchant scoping", () => {
  test("opening a merchant review only requests that merchant's records", async ({ authenticatedPage }) => {
    const merchantRequests: string[] = [];
    authenticatedPage.on("request", (request) => {
      const url = request.url();
      if (url.includes("/api/v1/admin/merchants/")) merchantRequests.push(url);
    });

    await authenticatedPage.goto("/merchants");
    await expect(authenticatedPage.getByRole("button", { name: "Actions for Beacon Books" })).toBeVisible({ timeout: 10000 });

    await authenticatedPage.getByRole("button", { name: "Actions for Beacon Books" }).click();
    await authenticatedPage.getByRole("menuitem", { name: "View details for merchant Beacon Books" }).click();
    await expect(authenticatedPage.locator("text=API quota:")).toBeVisible({ timeout: 10000 });

    expect(merchantRequests.length).toBeGreaterThan(0);
    expect(merchantRequests.every((url) => url.includes("/merchants/m2/"))).toBe(true);
    expect(merchantRequests.some((url) => url.includes("/merchants/m1/"))).toBe(false);
  });
});

test.describe("Keyboard access", () => {
  test("row action menus open, navigate, and close with the keyboard", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    const trigger = authenticatedPage.getByRole("button", { name: "Actions for Acme Store" });
    await expect(trigger).toBeVisible({ timeout: 10000 });

    await trigger.focus();
    await authenticatedPage.keyboard.press("ArrowDown");

    const menu = authenticatedPage.getByRole("menu");
    await expect(menu).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(menu.getByRole("menuitem").first()).toBeFocused();

    await authenticatedPage.keyboard.press("End");
    await expect(menu.getByRole("menuitem").last()).toBeFocused();

    await authenticatedPage.keyboard.press("Home");
    await expect(menu.getByRole("menuitem").first()).toBeFocused();
    await authenticatedPage.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem").nth(1)).toBeFocused();

    await authenticatedPage.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(trigger).toBeFocused();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});

test.describe("Audit visibility", () => {
  test("audit log surfaces actor, action and outcome", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/audit");

    await expect(authenticatedPage.getByRole("heading", { name: "Audit Log", level: 2 })).toBeVisible();
    await expect(authenticatedPage.getByText("superadmin@dukadesk.com").first()).toBeVisible();
    const table = authenticatedPage.getByRole("table");
    await expect(table.getByText("Merchant Approved (Site Builder)")).toBeVisible();
    await expect(table.getByText("success", { exact: true }).first()).toBeVisible();
  });
});
