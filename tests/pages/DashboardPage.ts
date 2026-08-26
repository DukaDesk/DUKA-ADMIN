import { Page, Locator, expect } from "@playwright/test";

export class DashboardPage {
  readonly page: Page;
  readonly title: Locator;
  readonly subtitle: Locator;
  readonly metricCards: Locator;
  readonly revenueChart: Locator;
  readonly merchantChart: Locator;
  readonly quickStats: Locator;
  readonly refreshTime: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h2:has-text('Platform Overview')");
    this.subtitle = page.locator("text=Live administrative data");
    this.metricCards = page.locator(".metricCard, [class*='metricCard']");
    this.revenueChart = page.locator("section:has(h3:has-text('Revenue Trend'))");
    this.merchantChart = page.locator("section:has(h3:has-text('Merchant Growth'))");
    this.quickStats = page.locator("section:has(h3:has-text('Platform Health'))");
    this.refreshTime = page.locator("text=/Last updated:/");
  }

  async goto() {
    await this.page.goto("/dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.subtitle).toBeVisible();
    await expect(this.metricCards.first()).toBeVisible({ timeout: 10000 });
  }

  async expectMetricCount(count: number) {
    await expect(this.metricCards).toHaveCount(count);
  }

  async expectChartsVisible() {
    await expect(this.revenueChart).toBeVisible();
    await expect(this.merchantChart).toBeVisible();
  }

  async expectQuickStatsVisible() {
    await expect(this.quickStats).toBeVisible();
  }

  async getMetricValues() {
    const cards = await this.metricCards.all();
    const values = [];
    for (const card of cards) {
      const label = await card.locator("[class*='metricLabel']").textContent();
      const value = await card.locator("[class*='metricValue']").textContent();
      if (label && value) {
        values.push({ label: label.trim(), value: value.trim() });
      }
    }
    return values;
  }
}