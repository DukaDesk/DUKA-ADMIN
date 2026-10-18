import { test, expect, Page, Route } from "@playwright/test";

// Deterministic, fully mocked acceptance coverage for the platform-admin
// Support ticket, governed Policy, and operational Export flows.
// No live backend, no OTP: the session is seeded directly into localStorage.

const ADMIN = {
  id: "admin-1",
  email: "superadmin@dukadesk.com",
  name: "Super Admin",
  role: "super_admin",
  token: "test-token",
};

const TICKETS = [
  { id: "t1", subject: "Cannot publish catalog", status: "open", priority: "high", assigneeId: null, createdAt: "2026-10-01T10:00:00.000Z" },
  { id: "t2", subject: "Billing mismatch", status: "resolved", priority: "normal", assigneeId: "admin-1", createdAt: "2026-10-02T11:00:00.000Z" },
];

const POLICY = { id: "p1", key: "data-retention", name: "Data Retention", status: "draft", version: 1 };

const TICKET_DETAIL = {
  ...TICKETS[0],
  description: "Merchant cannot publish their catalog after approval.",
  events: [{ id: "e1", type: "created", message: "Ticket created", createdAt: "2026-10-01T10:00:00.000Z" }],
};

type Handler = {
  method: string;
  match: RegExp;
  body: unknown;
  status?: number;
};

const JSON_HEADERS = { "content-type": "application/json" };

function json(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, headers: JSON_HEADERS, body: JSON.stringify(body) });
}

async function installApi(page: Page, handlers: Handler[]) {
  await page.route("**/api/v1/**", async (route) => {
    const request = route.request();
    const method = request.method();
    const path = new URL(request.url()).pathname;
    const handler = handlers.find((h) => h.method === method && h.match.test(path));
    if (handler) return json(route, handler.body, handler.status);
    // Never abort: apiClient retries aborted GETs with backoff, which is slow.
    if (method === "GET") return json(route, { success: true, message: "OK", data: [], total: 0 });
    return json(route, { success: true, message: "OK", data: {} });
  });
}

async function seedSession(page: Page) {
  await page.addInitScript((admin) => {
    localStorage.setItem("admin_token", admin.token);
    localStorage.setItem("dukadesk_admin", JSON.stringify(admin));
  }, ADMIN);
}

test.describe("Support tickets (mocked)", () => {
  test("lists tickets and opens the triage drawer", async ({ page }) => {
    await seedSession(page);
    await installApi(page, [
      { method: "GET", match: /\/admin\/support-tickets\/t1$/, body: { success: true, data: TICKET_DETAIL } },
      { method: "GET", match: /\/admin\/support-tickets\/?$/, body: { success: true, data: TICKETS, total: TICKETS.length } },
    ]);

    await page.goto("/support");
    await expect(page.locator('h2:has-text("Support Tickets")')).toBeVisible();
    await expect(page.getByRole("cell", { name: "Cannot publish catalog" })).toBeVisible();

    await page.getByRole("button", { name: /Actions for/ }).first().click();
    await page.getByRole("menuitem", { name: "View" }).click();
    await expect(page.getByText("Merchant cannot publish their catalog after approval.")).toBeVisible();
    await expect(page.getByText("Ticket created")).toBeVisible();
  });

  test("creates a ticket and surfaces the success toast", async ({ page }) => {
    await seedSession(page);
    await installApi(page, [
      { method: "GET", match: /\/admin\/support-tickets\/?$/, body: { success: true, data: TICKETS, total: TICKETS.length } },
      { method: "POST", match: /\/admin\/support-tickets\/?$/, body: { success: true, data: { id: "t3" } } },
    ]);

    await page.goto("/support");
    await page.getByRole("button", { name: "New Ticket" }).click();
    const dialog = page.getByRole("dialog", { name: "New support ticket" });
    await dialog.getByLabel("Subject", { exact: true }).fill("Refund request");
    await dialog.getByLabel("Description", { exact: true }).fill("Merchant is asking for a refund review.");
    await page.getByRole("button", { name: "Create Ticket" }).click();
    await expect(page.locator('[role="status"], [role="alert"]')).toContainText("Ticket created");
  });
});

test.describe("Governed policies (mocked)", () => {
  test("submits a draft policy for review", async ({ page }) => {
    await seedSession(page);
    await installApi(page, [
      { method: "GET", match: /\/admin\/policies\/?$/, body: { success: true, data: [POLICY], total: 1 } },
      { method: "POST", match: /\/admin\/policies\/p1\/submit$/, body: { success: true, data: { ...POLICY, status: "in_review" } } },
    ]);

    await page.goto("/settings");
    await page.getByRole("tab", { name: "Policies" }).click();
    await expect(page.getByRole("heading", { name: "Platform Policies" })).toBeVisible();
    await expect(page.getByText("Data Retention")).toBeVisible();

    await page.getByRole("button", { name: "Submit", exact: true }).click();
    await expect(page.locator('[role="status"], [role="alert"]')).toContainText("Policy submitted for review");
  });
});

test.describe("Operational exports (mocked)", () => {
  test("exports the support-tickets view as CSV after confirmation", async ({ page }) => {
    await seedSession(page);
    await installApi(page, [
      { method: "GET", match: /\/admin\/support-tickets\/?$/, body: { success: true, data: TICKETS, total: TICKETS.length } },
      {
        method: "GET",
        match: /\/admin\/reports\/support-tickets\/export/,
        body: { success: true, data: { report: "support-tickets", filename: "support-tickets.csv", rows: 2, csv: "id,subject\nt1,Cannot publish catalog\n" } },
      },
    ]);

    await page.goto("/support");
    await page.getByRole("button", { name: "Export CSV" }).click();
    await expect(page.getByRole("dialog", { name: "Export data as CSV?" })).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export", exact: true }).click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toBe("support-tickets.csv");
    await expect(page.locator('[role="status"], [role="alert"]')).toContainText("Exported 2 row(s)");
  });
});

test.describe("Shared table accessibility (mocked)", () => {
  test("sortable header is keyboard operable and announces sort state", async ({ page }) => {
    await seedSession(page);
    await installApi(page, [
      { method: "GET", match: /\/admin\/support-tickets\/?$/, body: { success: true, data: TICKETS, total: TICKETS.length } },
    ]);

    await page.goto("/support");
    const header = page.getByRole("columnheader", { name: /Subject/ });
    await expect(header).toHaveAttribute("aria-sort", "none");

    const sortButton = page.getByRole("button", { name: /Sort by Subject/ });
    await sortButton.focus();
    await page.keyboard.press("Enter");
    await expect(header).toHaveAttribute("aria-sort", "ascending");
  });
});
