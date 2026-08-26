import { Page, Locator, expect } from "@playwright/test";

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitBtn: Locator;
  readonly otpInputs: Locator;
  readonly verifyBtn: Locator;
  readonly errorBanner: Locator;
  readonly fillDemoBtn: Locator;
  readonly fillDemoOtpBtn: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.submitBtn = page.locator('button:has-text("Continue")');
    this.otpInputs = page.locator('input[maxlength="1"]');
    this.verifyBtn = page.locator('button:has-text("Verify")');
    this.errorBanner = page.locator('[role="alert"]');
    this.fillDemoBtn = page.locator('button:has-text("Auto-fill")').first();
    this.fillDemoOtpBtn = page.locator('button:has-text("Auto-fill Demo Code")');
  }

  async goto() {
    await this.page.goto("/");
    await this.page.waitForLoadState("networkidle");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitBtn.click();
  }

  async fillDemoCredentials() {
    await this.fillDemoBtn.click();
  }

  async fillOtp(code: string) {
    for (let i = 0; i < code.length; i++) {
      await this.otpInputs.nth(i).fill(code[i]);
    }
  }

  async fillDemoOtp() {
    await this.fillDemoOtpBtn.click();
  }

  async verifyOtp() {
    await this.verifyBtn.click();
  }

  async expectError(message: string) {
    await expect(this.errorBanner).toContainText(message);
  }

  async expectOtpStep() {
    await expect(this.otpInputs.first()).toBeVisible();
  }

  async expectDashboard() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }
}