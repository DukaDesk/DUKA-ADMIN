import { test as base, Page } from "@playwright/test";
import { ADMIN, installApiMocks, seedSession } from "./mocks";

interface AuthFixtures {
  authenticatedPage: Page;
}

// Deterministic by default: seeds an admin session into localStorage and mocks
// the API so specs run without a live backend or OTP. Set E2E_LIVE=1 to use the
// legacy live-credential login instead.
export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    if (process.env.E2E_LIVE === "1") {
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
      return;
    }

    await seedSession(page);
    await installApiMocks(page);
    await use(page);
  },
});

export { expect } from "@playwright/test";
export { ADMIN, installApiMocks, seedSession } from "./mocks";
