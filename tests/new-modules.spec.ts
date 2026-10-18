import { test, expect } from "./utils/auth";
import { canAccessPage, canPerform, canReviewMerchantApps } from "../src/services/permissions";

test("merchant app review is limited to super_admin and operations", () => {
  const operations = { role: "operations" };
  const support = { role: "support_agent" };
  const platformOperator = { role: "platform_operator" };

  expect(canAccessPage(operations, "merchants")).toBe(true);
  expect(canReviewMerchantApps(operations)).toBe(true);
  expect(canPerform(operations, "merchants:manage")).toBe(false);
  expect(canReviewMerchantApps({ role: "super_admin" })).toBe(true);
  expect(canReviewMerchantApps(support)).toBe(false);
  expect(canReviewMerchantApps(platformOperator)).toBe(false);
});

test("admin access defaults to deny without an explicit authorized role", () => {
  const incompleteIdentity = {
    email: "admin@example.test",
    name: "Admin User",
    token: "test-token",
    username: "admin",
  };

  expect(canPerform(incompleteIdentity, "dashboard:read")).toBe(false);
  expect(canAccessPage(incompleteIdentity, "dashboard")).toBe(false);
  expect(canAccessPage({ role: "unknown_role" }, "merchants")).toBe(false);
});

test("platform admin-user management is restricted to super admins", () => {
  const platformOperator = { role: "platform_operator" };
  const support = { role: "support_agent" };
  const superAdmin = { role: "super_admin" };

  expect(canPerform(platformOperator, "users:manage")).toBe(false);
  expect(canAccessPage(platformOperator, "pending-admins")).toBe(false);
  expect(canPerform(support, "users:manage")).toBe(false);
  expect(canPerform(superAdmin, "users:manage")).toBe(true);
  expect(canAccessPage(superAdmin, "pending-admins")).toBe(true);
});

test("Operations and Support Agent receive only their canonical permissions", () => {
  const operations = { role: "operations" };
  const support = { role: "support_agent" };

  expect(canAccessPage(operations, "merchants")).toBe(true);
  expect(canAccessPage(operations, "dashboard")).toBe(false);
  expect(canPerform(operations, "merchants:read")).toBe(false);
  expect(canPerform(operations, "merchant-apps:review")).toBe(true);

  expect(canPerform(support, "support:access")).toBe(true);
  expect(canAccessPage(support, "merchants")).toBe(false);
  expect(canAccessPage(support, "audit")).toBe(false);
});

test.describe("Available Business Dashboard Modules (BD-ANAL/BD-MKT)", () => {
  const pages = [
    { path: "/analytics", title: "Platform Analytics", spec: "BD-ANAL-001" },
    { path: "/marketing", title: "Marketing", spec: "BD-MKT-001" },
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

  test("platform analytics shows B2B metrics without booking analytics", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/analytics");
    await authenticatedPage.waitForLoadState("networkidle");
    await expect(authenticatedPage.locator('h2:has-text("Platform Analytics")')).toBeVisible();
    await expect(authenticatedPage.getByText("Revenue", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("Transactions", { exact: true }).first()).toBeVisible();
    await expect(authenticatedPage.getByText("Active Users · 30 days", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("Published Merchants", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("Bookings", { exact: true })).toHaveCount(0);
    await expect(authenticatedPage.getByText("Booking Analytics", { exact: true })).toHaveCount(0);
  });

  test("marketing shows supported integrations and infrastructure overview renders", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/marketing");
    await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.locator('h2:has-text("Marketing")')).toBeVisible();
      await expect(authenticatedPage.getByRole("note")).toContainText("campaign history and sending are not available");
      await expect(authenticatedPage.locator('h2:has-text("Available Integrations")')).toBeVisible();
      await authenticatedPage.goto("/infrastructure");
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.locator('h2:has-text("Infrastructure")')).toBeVisible();
    });
});

test.describe("Merchant app review queue", () => {
  test("queue shortcuts sync with the app review filter", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");
    const appStatus = authenticatedPage.getByRole("combobox", { name: "App Review" });
    const needsReview = authenticatedPage.getByRole("button", { name: "Needs Review", exact: true });

    await expect(appStatus).toBeVisible();
    await expect(needsReview).toHaveAttribute("aria-pressed", "false");
    await needsReview.click();
    await expect(needsReview).toHaveAttribute("aria-pressed", "true");
    await expect(appStatus).toHaveValue("in_review");

    const allApps = authenticatedPage.getByRole("button", { name: "All Apps", exact: true });
    await allApps.click();
    await expect(allApps).toHaveAttribute("aria-pressed", "true");
    await expect(appStatus).toHaveValue("");
  });
});

test.describe("Quotas & Audit — Administration domain", () => {
  test("merchant action menu and review drawer expose live detail", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    await authenticatedPage.waitForLoadState("networkidle");
    const actionMenu = authenticatedPage.getByRole("button", { name: /Actions for/ }).first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      const menu = authenticatedPage.getByRole("menu");
      await expect(menu.getByRole("menuitem")).toHaveCount(3);
      await expect(menu).toContainText("View Details");
      await expect(menu).toContainText(/Suspend|Unsuspend/);
      await expect(menu).toContainText("Delete");
      await authenticatedPage.locator("h2").first().click();
      await expect(actionMenu).toHaveAttribute("aria-expanded", "false");
      await actionMenu.click();
      await authenticatedPage.getByRole("menuitem", { name: /View details for merchant/ }).click();
      await expect(authenticatedPage.locator("text=API quota:")).toBeVisible({ timeout: 10000 });
    }
  });
});
