import { test as base, Page } from "@playwright/test";

interface AuthFixtures {
  authenticatedPage: Page;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    await page.goto("/");
    
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    const submitBtn = page.locator('button:has-text("Continue")');
    
    if (await emailInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await emailInput.fill("superadmin@dukadesk.com");
      await passwordInput.fill("Admin@2024!");
      await submitBtn.click();
      
      const otpInputs = page.locator('input[maxlength="1"]');
      if (await otpInputs.first().isVisible({ timeout: 5000 }).catch(() => false)) {
        for (let i = 0; i < 6; i++) {
          await otpInputs.nth(i).fill("1");
        }
        await page.locator('button:has-text("Verify")').click();
      }
      
      await page.waitForURL("**/dashboard", { timeout: 10000 });
    }
    
    await use(page);
  },
});

export { expect } from "@playwright/test";