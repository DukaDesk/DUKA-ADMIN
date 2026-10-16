import { Page, Locator, expect } from "@playwright/test";

export class MerchantsPage {
  readonly page: Page;
  readonly title: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly planFilter: Locator;
  readonly table: Locator;
  readonly rows: Locator;
  readonly approveButtons: Locator;
  readonly actionMenus: Locator;
  readonly pagination: Locator;
  readonly pageSizeSelect: Locator;
  readonly toast: Locator;

  constructor(page: Page) {
    this.page = page;
    this.title = page.locator("h2:has-text('Merchants')");
    this.searchInput = page.locator('input[type="search"]');
    this.statusFilter = page.locator('select:has(option:has-text("All Statuses"))');
    this.planFilter = page.locator('select:has(option:has-text("All Plans"))');
    this.table = page.locator("table");
    this.rows = page.locator("tbody tr");
    this.approveButtons = page.locator('button:has-text("Approve")');
    this.actionMenus = page.locator('button[aria-haspopup="menu"]');
    this.pagination = page.locator('[aria-label="Pagination"]');
    this.pageSizeSelect = page.locator('select:has(option:has-text("per page"))');
    this.toast = page.locator('[role="status"], [role="alert"]');
  }

  async goto() {
    await this.page.goto("/merchants");
    await this.page.waitForLoadState("networkidle");
  }

  async expectLoaded() {
    await expect(this.title).toBeVisible();
    await expect(this.table).toBeVisible({ timeout: 10000 });
  }

  async search(term: string) {
    await this.searchInput.fill(term);
    await this.page.waitForTimeout(300);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.selectOption(status);
    await this.page.waitForTimeout(300);
  }

  async filterByPlan(plan: string) {
    await this.planFilter.selectOption(plan);
    await this.page.waitForTimeout(300);
  }

  async expectRowCount(count: number) {
    await expect(this.rows).toHaveCount(count);
  }

  async expectRowContains(text: string) {
    await expect(this.rows.filter({ hasText: text })).toHaveCountGreaterThan(0);
  }

  async clickApprove(rowIndex: number = 0) {
    await this.approveButtons.nth(rowIndex).click();
  }

  async clickSuspend(rowIndex: number = 0) {
    await this.actionMenus.nth(rowIndex).click();
    await this.page.getByRole("menuitem", { name: /^(Suspend|Unsuspend) merchant/ }).click();
  }

  async clickView(rowIndex: number = 0) {
    await this.actionMenus.nth(rowIndex).click();
    await this.page.getByRole("menuitem", { name: /View details for merchant/ }).click();
  }

  async expectToast(message: string) {
    await expect(this.toast).toContainText(message);
  }

  async changePageSize(size: number) {
    await this.pageSizeSelect.selectOption(size.toString());
    await this.page.waitForTimeout(300);
  }

  async goToPage(pageNum: number) {
    const pageBtn = this.pagination.locator(`button:has-text("${pageNum}")`);
    await pageBtn.click();
    await this.page.waitForTimeout(300);
  }

  async getRowData(rowIndex: number = 0) {
    const row = this.rows.nth(rowIndex);
    const cells = row.locator("td");
    const count = await cells.count();
    const data = {};
    for (let i = 0; i < count; i++) {
      data[i] = await cells.nth(i).textContent();
    }
    return data;
  }
}