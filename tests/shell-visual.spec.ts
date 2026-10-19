import { test, expect } from "./utils/auth";

// Visual/layout hierarchy verification for the authenticated shell, sidebar and
// Settings (UI-0003). These assert stable structural invariants (bounds, colours,
// roles, active state) rather than brittle pixel snapshots. Desktop-only: on the
// mobile emulations the sidebar is a closed off-canvas drawer by design.

test.beforeEach(({}, testInfo) => {
  test.skip(/Mobile/.test(testInfo.project.name), "Desktop shell layout invariant");
});

test("authenticated shell pins the sidebar beside the content @visual", async ({ authenticatedPage }) => {
  await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
  await authenticatedPage.goto("/dashboard");
  await authenticatedPage.waitForLoadState("networkidle");

  const nav = authenticatedPage.getByRole("navigation", { name: "Admin navigation" });
  const main = authenticatedPage.locator("main");
  await expect(nav).toBeVisible();
  await expect(main).toBeVisible();

  const navBounds = await nav.boundingBox();
  const mainBounds = await main.boundingBox();
  if (!navBounds || !mainBounds) throw new Error("Shell regions have no rendered bounds");

  expect(navBounds.x).toBeLessThanOrEqual(1);
  expect(navBounds.width).toBeGreaterThanOrEqual(240);
  expect(navBounds.width).toBeLessThanOrEqual(300);
  expect(mainBounds.x).toBeGreaterThanOrEqual(navBounds.x + navBounds.width - 1);
  expect(mainBounds.width).toBeGreaterThan(navBounds.width);

  await expect(nav).toHaveCSS("background-color", "rgb(26, 26, 46)");

  const active = nav.getByRole("button", { name: "Overview" });
  await expect(active).toHaveAttribute("aria-current", "page");
  await expect(authenticatedPage.getByRole("heading", { name: "Platform Overview", level: 2 })).toBeVisible();
});

test("collapsing the sidebar preserves the icon rail and active state @visual", async ({ authenticatedPage }) => {
  await authenticatedPage.setViewportSize({ width: 1280, height: 800 });
  await authenticatedPage.goto("/dashboard");
  await authenticatedPage.waitForLoadState("networkidle");

  const nav = authenticatedPage.getByRole("navigation", { name: "Admin navigation" });
  await authenticatedPage.getByRole("button", { name: "Collapse navigation" }).click();

  await expect
    .poll(async () => (await nav.boundingBox())?.width ?? 999)
    .toBeLessThanOrEqual(80);
  await expect(nav).toBeVisible();
  await expect(nav.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "page");
});

test("settings tabs render inside the shell and switch panels @visual", async ({ authenticatedPage }) => {
  await authenticatedPage.setViewportSize({ width: 1440, height: 900 });
  await authenticatedPage.goto("/settings");
  await authenticatedPage.waitForLoadState("networkidle");

  await expect(authenticatedPage.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(authenticatedPage.getByRole("navigation", { name: "Admin navigation" })).toBeVisible();

  const tablist = authenticatedPage.getByRole("tablist", { name: "Settings categories" });
  await expect(tablist).toBeVisible();
  await expect(tablist.getByRole("tab")).toHaveCount(7);

  const featureFlags = authenticatedPage.getByRole("tab", { name: "Feature Flags" });
  await featureFlags.click();
  await expect(featureFlags).toHaveAttribute("aria-selected", "true");

  const panel = authenticatedPage.getByRole("tabpanel");
  await expect(panel).toBeVisible();
  await expect(panel).toContainText("Feature Flags");
});
