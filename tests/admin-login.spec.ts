import { test, expect } from "@playwright/test";

test("platform admin session is issued only after OTP verification", async ({ page }) => {
  const requests = [];

  await page.route("**/auth/login", async (route) => {
    requests.push("login");
    await route.fulfill({
      json: {
        success: true,
        data: {
          requiresOtp: true,
          challengeId: "7ab6b44d-fb67-4ed2-a4f8-61f5a85a5ec6",
          user: { id: "admin-1", email: "admin@example.com", role: "super_admin" },
        },
      },
    });
  });
  await page.route("**/auth/send-otp", async (route) => {
    requests.push("send-otp");
    expect(route.request().postDataJSON()).toMatchObject({
      email: "admin@example.com",
      challengeId: "7ab6b44d-fb67-4ed2-a4f8-61f5a85a5ec6",
    });
    await route.fulfill({ json: { success: true, data: { message: "OTP sent" } } });
  });
  await page.route("**/auth/verify-admin-login", async (route) => {
    requests.push("verify-admin-login");
    expect(route.request().postDataJSON()).toMatchObject({
      email: "admin@example.com",
      otp: "123456",
      challengeId: "7ab6b44d-fb67-4ed2-a4f8-61f5a85a5ec6",
    });
    await route.fulfill({
      json: {
        success: true,
        data: {
          accessToken: "verified-access-token",
          refreshToken: "verified-refresh-token",
          user: { id: "admin-1", email: "admin@example.com", role: "super_admin" },
        },
      },
    });
  });

  await page.goto("/");
  await page.getByPlaceholder("superadmin@dukadesk.com").fill("admin@example.com");
  await page.getByPlaceholder("Enter your password").fill("correct-horse-battery");
  await page.getByRole("button", { name: /Continue/ }).click();
  await expect(page.getByRole("heading", { name: "Two-Factor Authentication" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("admin_token"))).toBeNull();

  for (const [index, digit] of [..."123456"].entries()) {
    await page.locator('input[maxlength="1"]').nth(index).fill(digit);
  }
  await page.getByRole("button", { name: /Verify & Sign In/ }).click();

  await expect(page).toHaveURL(/\/dashboard$/);
  expect(await page.evaluate(() => localStorage.getItem("admin_token"))).toBe("verified-access-token");
  expect(requests).toEqual(["login", "send-otp", "verify-admin-login"]);
});
