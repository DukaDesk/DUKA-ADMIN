import { test, expect } from "./utils/auth";
import { canAccessPage, canPerform, canReviewMerchantApps } from "../src/services/permissions";

test("merchant app review is limited to super_admin and operations", () => {
  const operations = { role: "operations" };
  const support = { role: "support_agent" };
  const platformOperator = { role: "platform_operator" };

  expect(canAccessPage(operations, "merchants")).toBe(true);
  expect(canReviewMerchantApps(operations)).toBe(true);
  expect(canPerform(operations, "merchants:manage")).toBe(false);
  expect(canReviewMerchantApps({ role: "super_admin" })).toBe(true);
  expect(canReviewMerchantApps(support)).toBe(false);
  expect(canReviewMerchantApps(platformOperator)).toBe(false);
});

test("admin access defaults to deny without an explicit authorized role", () => {
  const incompleteIdentity = {
    email: "admin@example.test",
    name: "Admin User",
    token: "test-token",
    username: "admin",
  };

  expect(canPerform(incompleteIdentity, "dashboard:read")).toBe(false);
  expect(canAccessPage(incompleteIdentity, "dashboard")).toBe(false);
  expect(canAccessPage({ role: "unknown_role" }, "merchants")).toBe(false);
});

test("platform admin-user management is restricted to super admins", () => {
  const platformOperator = { role: "platform_operator" };
  const support = { role: "support_agent" };
  const superAdmin = { role: "super_admin" };

  expect(canPerform(platformOperator, "users:manage")).toBe(false);
  expect(canAccessPage(platformOperator, "pending-admins")).toBe(false);
  expect(canPerform(support, "users:manage")).toBe(false);
  expect(canPerform(superAdmin, "users:manage")).toBe(true);
  expect(canAccessPage(superAdmin, "pending-admins")).toBe(true);
});

test("Operations and Support Agent receive only their canonical permissions", () => {
  const operations = { role: "operations" };
  const support = { role: "support_agent" };

  expect(canAccessPage(operations, "merchants")).toBe(true);
  expect(canAccessPage(operations, "dashboard")).toBe(false);
  expect(canPerform(operations, "merchants:read")).toBe(false);
  expect(canPerform(operations, "merchant-apps:review")).toBe(true);

  expect(canPerform(support, "support:access")).toBe(true);
  expect(canAccessPage(support, "merchants")).toBe(false);
  expect(canAccessPage(support, "audit")).toBe(false);
});

test.describe("Available Business Dashboard Modules (BD-ANAL/BD-MKT)", () => {
  const pages = [
    { path: "/analytics", title: "Platform Analytics", spec: "BD-ANAL-001" },
    { path: "/marketing", title: "Marketing", spec: "BD-MKT-001" },
    { path: "/infrastructure", title: "Infrastructure", spec: "KB-141" },
  ];

  for (const { path, title, spec } of pages) {
    test(`${title} page loads live (${spec})`, async ({ authenticatedPage }) => {
      await authenticatedPage.goto(path);

      // Title from page h2 or header
      await expect(authenticatedPage.locator(`h2:has-text("${title}"), h3:has-text("${title}")`).first()).toBeVisible({ timeout: 10000 });
      // No mock banner â€” ensure live data or emptyMessage, not error with mock
      await expect(authenticatedPage.locator('[role="alert"]')).toHaveCount(0);
    });
  }

  test("platform analytics shows B2B metrics without booking analytics", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/analytics");

    await expect(authenticatedPage.locator('h2:has-text("Platform Analytics")')).toBeVisible({ timeout: 15000 });
    await expect(authenticatedPage.getByRole("group", { name: "Select analytics timeframe" })).toBeVisible();
    await expect(authenticatedPage.getByText("Revenue", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("Transactions", { exact: true }).first()).toBeVisible();
    await expect(authenticatedPage.getByText(/Active Users .* 30 days/)).toBeVisible();
    await expect(authenticatedPage.getByText("Published Merchants", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("Bookings", { exact: true })).toHaveCount(0);
    await expect(authenticatedPage.getByText("Booking Analytics", { exact: true })).toHaveCount(0);
  });

  test("marketing shows supported integrations and infrastructure overview renders", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/marketing");

      await expect(authenticatedPage.locator('h2:has-text("Marketing")')).toBeVisible();
      await expect(authenticatedPage.getByRole("note")).toContainText("campaign history and sending are not available");
      await expect(authenticatedPage.locator('h2:has-text("Available Integrations")')).toBeVisible();
      await authenticatedPage.goto("/infrastructure");

      await expect(authenticatedPage.locator('h2:has-text("Infrastructure")')).toBeVisible();
    });
});

test.describe("Merchant app review queue", () => {
  test("queue shortcuts sync with the app review filter", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");

    const appStatus = authenticatedPage.getByRole("combobox", { name: "App Review" });
    const needsReview = authenticatedPage.getByRole("button", { name: "Needs Review", exact: true });

    await expect(appStatus).toBeVisible();
    await expect(needsReview).toHaveAttribute("aria-pressed", "false");
    await needsReview.click();
    await expect(needsReview).toHaveAttribute("aria-pressed", "true");
    await expect(appStatus).toHaveValue("in_review");

    const allApps = authenticatedPage.getByRole("button", { name: "All Apps", exact: true });
    await allApps.click();
    await expect(allApps).toHaveAttribute("aria-pressed", "true");
    await expect(appStatus).toHaveValue("");
  });

  test("submitted app preview renders the submitted screens", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");
    await authenticatedPage.getByRole("button", { name: "Actions for Beacon Books" }).click();
    await authenticatedPage.getByRole("menuitem", { name: "View details for merchant Beacon Books" }).click();

    const review = authenticatedPage.getByRole("dialog", { name: "Review Beacon Books" });
    await expect(review).toContainText("Screens: 2");

    const phone = review.getByRole("img", { name: /^Phone preview of Beacon Books App/ });
    await expect(phone).toHaveAttribute("aria-label", /Home/);

    const screen = review.getByRole("combobox", { name: "Screen" });
    await expect(screen).toHaveValue("0");
    await expect(screen.locator("option")).toHaveCount(2);

    await review.getByRole("button", { name: "Next screen" }).click();
    await expect(phone).toHaveAttribute("aria-label", /Menu/);
  });

  test("unverified merchant approval requires password re-authentication", async ({ authenticatedPage }) => {
    const approveCalls: string[] = [];
    authenticatedPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().includes("/apps/approve")) approveCalls.push(request.url());
    });

    await authenticatedPage.goto("/merchants");
    await authenticatedPage.getByRole("button", { name: "Actions for Beacon Books" }).click();
    await authenticatedPage.getByRole("menuitem", { name: "View details for merchant Beacon Books" }).click();

    const review = authenticatedPage.getByRole("dialog", { name: "Review Beacon Books" });
    await expect(review).toContainText("Approval is allowed without verification");
    await review.getByRole("button", { name: "Approve App" }).click();

    const prompt = authenticatedPage.getByRole("dialog", { name: "Confirm your password" });
    await expect(prompt).toContainText("is not verified");
    await prompt.getByRole("button", { name: "Verify & Approve" }).click();
    await expect(prompt.getByRole("alert")).toHaveText("Enter your password to continue");

    await prompt.getByLabel("Admin password").fill("wrong-password");
    await prompt.getByRole("button", { name: "Verify & Approve" }).click();
    await expect(prompt.getByRole("alert")).toHaveText("Incorrect password. Please try again.");
    expect(approveCalls).toHaveLength(0);

    await prompt.getByLabel("Admin password").fill("AdminPass123!");
    await prompt.getByRole("button", { name: "Verify & Approve" }).click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Beacon Books app approved" })).toBeVisible();
    await expect(prompt).toHaveCount(0);
    expect(approveCalls).toHaveLength(1);
  });
});

test.describe("Quotas & Audit - Administration domain", () => {
  test("merchant action menu and review drawer expose live detail", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/merchants");

    const actionMenu = authenticatedPage.getByRole("button", { name: /Actions for/ }).first();
    if (await actionMenu.isVisible()) {
      await actionMenu.click();
      const menu = authenticatedPage.getByRole("menu");
      await expect(menu.getByRole("menuitem")).toHaveCount(3);
      await expect(menu).toContainText("View Details");
      await expect(menu).toContainText(/Suspend|Unsuspend/);
      await expect(menu).toContainText("Delete");
      await authenticatedPage.locator("h2").first().click();
      await expect(actionMenu).toHaveAttribute("aria-expanded", "false");
      await actionMenu.click();
      await authenticatedPage.getByRole("menuitem", { name: /View details for merchant/ }).click();
      await expect(authenticatedPage.locator("text=API quota:")).toBeVisible({ timeout: 10000 });
    }
  });
});

test.describe("Marketplace moderation", () => {
  test("lists live-shaped listings and scopes category/search filters", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/marketplace");
    await expect(authenticatedPage.getByRole("heading", { name: "Marketplace Listings", level: 2 })).toBeVisible();

    const table = authenticatedPage.getByRole("table");
    await expect(table).toContainText("Acme Loyalty");
    await expect(table).toContainText("Beacon Bookings");
    await expect(table).toContainText("Acme Store");
    await expect(table).toContainText("pending review");
    await expect(table).toContainText("540");

    await authenticatedPage.getByRole("combobox", { name: "Category" }).selectOption("booking");
    await expect(table).toContainText("Beacon Bookings");
    await expect(table).not.toContainText("Acme Loyalty");

    await authenticatedPage.getByRole("searchbox", { name: "Search Marketplace Listings" }).fill("Acme");
    await expect(authenticatedPage.getByText("No marketplace listings found matching your criteria.")).toBeVisible();
  });

  test("moderating a listing confirms via toast and row selection reveals bulk actions", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/marketplace");

    await authenticatedPage.getByRole("button", { name: "Approve listing Acme Loyalty" }).click();
    await expect(authenticatedPage.getByRole("status")).toContainText("Acme Loyalty approved");

    await authenticatedPage.getByRole("table").getByText("Beacon Bookings").click();
    const bulk = authenticatedPage.getByRole("toolbar", { name: "Bulk actions" });
    await expect(bulk).toContainText("1 selected");
    await expect(bulk.getByRole("button", { name: "Approve (1)" })).toBeVisible();
    await bulk.getByRole("button", { name: "Clear" }).click();
    await expect(bulk).toHaveCount(0);
  });
});

test.describe("Subscription governance", () => {
  test("shows the platform view and authoritative plan capabilities", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/subscriptions");
    await expect(authenticatedPage.getByRole("heading", { name: "Subscriptions", level: 2 })).toBeVisible();
    await expect(authenticatedPage.getByRole("note").filter({ hasText: "Platform operator view" })).toBeVisible();

    const table = authenticatedPage.getByRole("table");
    await expect(table).toContainText("Acme Store");
    await expect(table).toContainText("Professional");
    await expect(table).toContainText("active");
    await expect(table).toContainText("25,000");
    await expect(authenticatedPage.getByRole("button", { name: "View subscription for Acme Store" })).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: "Change plan for Beacon Books" })).toBeVisible();

    await authenticatedPage.getByRole("button", { name: "View subscription for Acme Store" }).click();

    const drawer = authenticatedPage.getByRole("dialog", { name: "Acme Store" });
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText("Plan capabilities");
    await expect(drawer).toContainText("max Products");
    await expect(drawer).toContainText("custom Domain: included");
  });

  test("changing a plan requires confirmation and reports success", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/subscriptions");

    await authenticatedPage.getByRole("button", { name: "Change plan for Acme Store" }).click();

    const dialog = authenticatedPage.getByRole("dialog", { name: "Change subscription plan?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Change Plan" }).click();

    await expect(authenticatedPage.getByRole("status")).toContainText("Plan updated for Acme Store");
  });
});

test.describe("Platform messaging", () => {
  test("inbox lists broadcasts and directs with kind filters", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/messaging");
    await expect(authenticatedPage.getByRole("heading", { name: "Platform Messaging", level: 2 })).toBeVisible();

    await expect(authenticatedPage.getByRole("button", { name: "Open Holiday hours" })).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: "Open Direct message" })).toBeVisible();
    await expect(authenticatedPage.getByText("BROADCAST", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("DIRECT", { exact: true })).toBeVisible();
    await expect(authenticatedPage.getByText("41 reads")).toBeVisible();

    await authenticatedPage.getByRole("tab", { name: "Directs" }).click();
    await expect(authenticatedPage.getByRole("button", { name: "Open Direct message" })).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: "Open Holiday hours" })).toHaveCount(0);

    await authenticatedPage.getByRole("tab", { name: "Broadcasts" }).click();
    await expect(authenticatedPage.getByRole("button", { name: "Open Holiday hours" })).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: "Open Direct message" })).toHaveCount(0);
  });

  test("composing a broadcast sends the expected payload", async ({ authenticatedPage }) => {
    const sent: Record<string, unknown>[] = [];
    authenticatedPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/admin/messages")) sent.push(request.postDataJSON());
    });

    await authenticatedPage.goto("/messaging");
    await authenticatedPage.getByRole("button", { name: "New Message" }).click();

    const dialog = authenticatedPage.getByRole("dialog", { name: "New platform message" });
    await dialog.getByLabel("Title (optional)").fill("Maintenance window");
    await dialog.getByLabel(/^Message/).fill("Platform maintenance tonight at 22:00.");
    await dialog.getByRole("button", { name: "Send message" }).click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Message sent" })).toBeVisible();
    await expect(dialog).toHaveCount(0);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ kind: "broadcast", audience: "mobile", title: "Maintenance window", body: "Platform maintenance tonight at 22:00." });
  });

  test("direct messages to a merchant require a tenant id and stay text-only", async ({ authenticatedPage }) => {
    const sent: Record<string, unknown>[] = [];
    authenticatedPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/admin/messages")) sent.push(request.postDataJSON());
    });

    await authenticatedPage.goto("/messaging");
    await authenticatedPage.getByRole("button", { name: "New Message" }).click();

    const dialog = authenticatedPage.getByRole("dialog", { name: "New platform message" });
    await dialog.getByRole("button", { name: "Direct message", exact: true }).click();
    await dialog.getByRole("button", { name: "Merchant", exact: true }).click();

    const send = dialog.getByRole("button", { name: "Send message" });
    await expect(dialog.getByLabel(/Merchant tenant id/)).toBeVisible();
    await expect(dialog.getByText("Merchant DMs are text-only; media is for mobile recipients.")).toBeVisible();
    await expect(dialog.locator('input[type="file"]')).toHaveCount(0);

    await dialog.getByLabel(/^Message/).fill("Please review your documents.");
    await expect(send).toBeDisabled();

    await dialog.getByLabel(/Merchant tenant id/).fill("m2");
    await expect(send).toBeEnabled();
    await send.click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Message sent" })).toBeVisible();
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({ kind: "direct", body: "Please review your documents.", tenantId: "m2" });
  });

  test("media uploads attach to mobile broadcasts and lock for merchant-only audiences", async ({ authenticatedPage }) => {
    const sent: Record<string, unknown>[] = [];
    const uploads: string[] = [];
    authenticatedPage.on("request", (request) => {
      if (request.method() === "POST" && request.url().endsWith("/admin/messages")) sent.push(request.postDataJSON());
      if (request.method() === "POST" && request.url().endsWith("/admin/media/upload")) uploads.push(request.url());
    });

    await authenticatedPage.goto("/messaging");
    await authenticatedPage.getByRole("button", { name: "New Message" }).click();

    const dialog = authenticatedPage.getByRole("dialog", { name: "New platform message" });
    const fileInput = dialog.locator('input[type="file"]');
    await expect(fileInput).toBeVisible();

    await dialog.getByLabel(/^Audience/).selectOption("merchants");
    await expect(dialog.getByText("Text only — media announcements are restricted to mobile users.")).toBeVisible();
    await expect(fileInput).toHaveCount(0);

    await dialog.getByLabel(/^Audience/).selectOption("mobile");
    await expect(fileInput).toBeVisible();
    await fileInput.setInputFiles({
      name: "promo.png",
      mimeType: "image/png",
      buffer: Buffer.from("fake-png"),
    });
    await expect(dialog.locator('img[src="https://cdn.test/media.png"]')).toBeVisible();

    await dialog.getByLabel(/^Message/).fill("Weekend promo starts now.");
    await dialog.getByRole("button", { name: "Send message" }).click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Message sent" })).toBeVisible();
    expect(uploads).toHaveLength(1);
    expect(sent).toHaveLength(1);
    expect(sent[0]).toEqual({
      kind: "broadcast",
      audience: "mobile",
      body: "Weekend promo starts now.",
      media: [{ url: "https://cdn.test/media.png", type: "image" }],
    });
  });

  test("opening a thread shows replies, sends a reply, and retracts", async ({ authenticatedPage }) => {
    await authenticatedPage.goto("/messaging");
    await authenticatedPage.getByRole("button", { name: "Open Holiday hours" }).click();

    const thread = authenticatedPage.getByRole("dialog", { name: "Holiday hours" });
    await expect(thread).toContainText("Thanks!");

    await thread.getByRole("textbox").fill("On it now");
    await thread.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Reply sent" })).toBeVisible();
    await expect(thread).toContainText("On it now");

    await thread.getByRole("button", { name: "Retract" }).click();
    const confirm = authenticatedPage.getByRole("dialog", { name: "Retract this message?" });
    await confirm.getByRole("button", { name: "Retract message" }).click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Message retracted" })).toBeVisible();
    await expect(authenticatedPage.getByRole("button", { name: "Open Holiday hours" })).toHaveCount(0);
  });
});

test.describe("Promo feed quotas", () => {
  test("per-tier quotas show defaults and save through the plan API", async ({ authenticatedPage }) => {
    const updates: Array<{ url: string; body: unknown }> = [];
    authenticatedPage.on("request", (request) => {
      if (request.method() === "PUT" && request.url().includes("/admin/plans/")) {
        updates.push({ url: request.url(), body: request.postDataJSON() });
      }
    });

    await authenticatedPage.goto("/settings");
    await authenticatedPage.getByRole("tab", { name: "Promo Feed" }).click();

    const panel = authenticatedPage.getByRole("tabpanel");
    await expect(panel).toContainText("Promo posts run for 24 hours");
    await expect(panel).toContainText("Free default 5/day");
    await expect(panel).toContainText("now 3/day");

    await panel.getByLabel("Daily promo posts for Professional").fill("7");
    await panel.getByRole("button", { name: "Save" }).first().click();

    await expect(authenticatedPage.getByRole("status").filter({ hasText: "Professional updated" })).toBeVisible();
    expect(updates).toHaveLength(1);
    expect(updates[0].url).toContain("/admin/plans/plan-pro");
    expect(updates[0].body).toEqual({ limits: { maxProducts: 500, storageGb: 10, dailyPromoPosts: 7 } });
    await expect(panel).toContainText("now 7/day");
  });

  test("invalid quotas are rejected before any request is sent", async ({ authenticatedPage }) => {
    let updates = 0;
    authenticatedPage.on("request", (request) => {
      if (request.method() === "PUT" && request.url().includes("/admin/plans/")) updates += 1;
    });

    await authenticatedPage.goto("/settings");
    await authenticatedPage.getByRole("tab", { name: "Promo Feed" }).click();

    const panel = authenticatedPage.getByRole("tabpanel");
    await panel.getByLabel("Daily promo posts for Professional").fill("0");
    await panel.getByRole("button", { name: "Save" }).first().click();

    await expect(authenticatedPage.getByRole("alert").filter({ hasText: "whole number between 1 and 100000" })).toBeVisible();
    expect(updates).toBe(0);
  });
});
