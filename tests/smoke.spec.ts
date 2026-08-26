import { test, expect } from "./utils/auth";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { SettingsPage } from "./pages/SettingsPage";
import { MerchantsPage } from "./pages/MerchantsPage";

test.describe("Admin Portal Smoke Tests", () => {
  test("login flow works with demo credentials", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.expectLoaded();
    await dashboard.expectMetricCount(8);
  });

  test("navigation to all main pages works", async ({ authenticatedPage }) => {
    const pages = [
      { path: "/dashboard", title: "Platform Overview" },
      { path: "/merchants", title: "Merchants" },
      { path: "/marketplace", title: "Marketplace Listings" },
      { path: "/audit", title: "Audit Log" },
      { path: "/subscriptions", title: "Subscriptions" },
      { path: "/settings", title: "Settings" },
    ];

    for (const { path, title } of pages) {
      await authenticatedPage.goto(path);
      await authenticatedPage.waitForLoadState("networkidle");
      await expect(authenticatedPage.locator(`h2:has-text("${title}")`)).toBeVisible({ timeout: 10000 });
    }
  });

  test("settings page tabs work", async ({ authenticatedPage }) => {
    const settings = new SettingsPage(authenticatedPage);
    await settings.goto();
    await settings.expectLoaded();

    const tabs = ["security", "notifications", "features", "platform", "team"] as const;
    for (const tab of tabs) {
      await settings.clickTab(tab);
      await settings.expectTabActive(tab);
    }
  });

  test("merchants page search and filters work", async ({ authenticatedPage }) => {
    const merchants = new MerchantsPage(authenticatedPage);
    await merchants.goto();
    await merchants.expectLoaded();

    await merchants.search("Acme");
    await merchants.expectRowContains("Acme");

    await merchants.filterByStatus("active");
    await merchants.expectRowContains("active");

    await merchants.filterByPlan("professional");
    await merchants.expectRowContains("professional");
  });

  test("dashboard displays charts and quick stats", async ({ authenticatedPage }) => {
    const dashboard = new DashboardPage(authenticatedPage);
    await dashboard.goto();
    await dashboard.expectLoaded();
    await dashboard.expectChartsVisible();
    await dashboard.expectQuickStatsVisible();
  });
});

test.describe("Login Page", () => {
  test("shows login form", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.submitBtn).toBeVisible();
  });

  test("shows OTP step after credentials", async ({ page }) => {
    const login = new LoginPage(page);
    await login.goto();
    await login.fillDemoCredentials();
    await login.login("superadmin@dukadesk.com", "Admin@2024!");
    await login.expectOtpStep();
  });
});

test.describe("Accessibility", () => {
  test("settings toggles are keyboard accessible", async ({ authenticatedPage }) => {
    const settings = new SettingsPage(authenticatedPage);
    await settings.goto();
    await settings.expectLoaded();

    const twoFAToggle = authenticatedPage.locator('button[role="switch"]:has-text("Two-Factor")');
    await twoFAToggle.focus();
    await expect(twoFAToggle).toBeFocused();
    await authenticatedPage.keyboard.press("Space");
    await settings.expectToast("Two-Factor Authentication");
  });

  test("tables have proper headers and sorting", async ({ authenticatedPage }) => {
    const merchants = new MerchantsPage(authenticatedPage);
    await merchants.goto();
    await merchants.expectLoaded();

    const headers = merchants.table.locator("th");
    await expect(headers.first()).toBeVisible();
    await expect(headers.first()).toHaveAttribute("aria-sort", "none");
  });
});