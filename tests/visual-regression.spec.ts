import { test, expect } from "@playwright/test";

test("admin login keeps its desktop visual hierarchy @visual", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");

  const leftPanel = page.locator('[class*="leftPanel"]');
  const rightPanel = page.locator('[class*="rightPanel"]');
  const heading = page.getByRole("heading", { name: /Platform Command Centre/ });
  const signInHeading = page.getByRole("heading", { name: "Admin Sign In" });
  const accent = page.locator("h1 span");

  await expect(heading).toBeVisible();
  await expect(signInHeading).toBeVisible();
  await expect(page.locator('input[type="email"]')).toBeVisible();
  await expect(page.locator('input[type="password"]')).toBeVisible();

  const leftBounds = await leftPanel.boundingBox();
  const rightBounds = await rightPanel.boundingBox();
  const headingBounds = await heading.boundingBox();
  const signInBounds = await signInHeading.boundingBox();

  if (!leftBounds || !rightBounds || !headingBounds || !signInBounds) {
    throw new Error("Login panels or headings have no rendered bounds");
  }

  expect(leftBounds.width).toBeGreaterThanOrEqual(520);
  expect(rightBounds.x).toBeGreaterThanOrEqual(leftBounds.x + leftBounds.width - 1);
  expect(headingBounds.x).toBeLessThan(rightBounds.x);
  expect(signInBounds.x).toBeGreaterThanOrEqual(rightBounds.x);
  await expect(leftPanel).toHaveCSS("background-color", "rgb(26, 26, 46)");
  await expect(rightPanel).toHaveCSS("background-color", "rgb(255, 255, 255)");
  await expect(accent).toHaveCSS("color", "rgb(244, 160, 38)");
});
