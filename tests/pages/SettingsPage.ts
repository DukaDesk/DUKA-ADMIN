import { Page, Locator, expect } from "@playwright/test";

export class SettingsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly tabs: Locator;
  readonly tabSecurity: Locator;
  readonly tabNotifications: Locator;
  readonly tabFeatures: Locator;
  readonly tabPlatform: Locator;
  readonly tabTeam: Locator;
  readonly toggleTwoFA: Locator;
  readonly toggleAutoApprove: Locator;
  readonly toggleEmailAlerts: Locator;
  readonly toggleSlackAlerts: Locator;
  readonly featureFlagsTable: Locator;
  readonly platformConfigTable: Locator;
  readonly adminTeamList: Locator;
  readonly inviteBtn: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h2:has-text('Settings')");
    this.tabs = page.locator('[role="tablist"]');
    this.tabSecurity = page.locator('[role="tab"]:has-text("Security")');
    this.tabNotifications = page.locator('[role="tab"]:has-text("Notifications")');
    this.tabFeatures = page.locator('[role="tab"]:has-text("Feature Flags")');
    this.tabPlatform = page.locator('[role="tab"]:has-text("Platform Config")');
    this.tabTeam = page.locator('[role="tab"]:has-text("Admin Team")');
    
    this.toggleTwoFA = page.locator('#setting-two_factor_auth, button[role="switch"]:has-text("Two-Factor")');
    this.toggleAutoApprove = page.locator('#setting-auto_approve_apps, button[role="switch"]:has-text("Auto-approve")');
    this.toggleEmailAlerts = page.locator('#setting-email_alerts, button[role="switch"]:has-text("Email Alerts")');
    this.toggleSlackAlerts = page.locator('#setting-slack_alerts, button[role="switch"]:has-text("Slack Alerts")');
    
    this.featureFlagsTable = page.locator("section:has(h3:has-text('Feature Flags')) table");
    this.platformConfigTable = page.locator("section:has(h3:has-text('Platform Configuration')) table");
    this.adminTeamList = page.locator("section:has(h3:has-text('Admin Team')) [class*='teamItem']");
    this.inviteBtn = page.locator('button:has-text("Invite Team Member")');
    this.toast = page.locator('[role="status"], [role="alert"]');
  }

  async goto() {
    await this.page.goto("/settings");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.tabs).toBeVisible();
  }

  async clickTab(tab: "security" | "notifications" | "features" | "platform" | "team") {
    const tabMap = {
      security: this.tabSecurity,
      notifications: this.tabNotifications,
      features: this.tabFeatures,
      platform: this.tabPlatform,
      team: this.tabTeam,
    };
    await tabMap[tab].click();
    await this.page.waitForTimeout(100);
  }

  async expectTabActive(tab: "security" | "notifications" | "features" | "platform" | "team") {
    const tabMap = {
      security: this.tabSecurity,
      notifications: this.tabNotifications,
      features: this.tabFeatures,
      platform: this.tabPlatform,
      team: this.tabTeam,
    };
    await expect(tabMap[tab]).toHaveAttribute("aria-selected", "true");
  }

  async toggleTwoFA() {
    await this.toggleTwoFA.click();
  }

  async toggleAutoApprove() {
    await this.toggleAutoApprove.click();
  }

  async toggleEmailAlerts() {
    await this.toggleEmailAlerts.click();
  }

  async toggleSlackAlerts() {
    await this.toggleSlackAlerts.click();
  }

  async expectToast(message: string) {
    await expect(this.toast).toContainText(message);
  }

  async expectFeatureFlagsLoaded() {
    await expect(this.featureFlagsTable).toBeVisible();
  }

  async expectPlatformConfigLoaded() {
    await expect(this.platformConfigTable).toBeVisible();
  }

  async expectAdminTeamVisible() {
    await expect(this.adminTeamList.first()).toBeVisible();
  }
}