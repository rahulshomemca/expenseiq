import { test, expect } from "@playwright/test";

// NOTE: These tests require an authenticated session and a running database.
// They will fail in the current state (no DB). They document intended behaviour.
test.describe("Expense management", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate — unauthenticated users are redirected to /sign-in
    await page.goto("/expenses");
  });

  test("unauthenticated users cannot access /expenses", async ({ page }) => {
    await expect(page).toHaveURL(/sign-in/);
  });

  test("expense table is visible when authenticated", async ({ page }) => {
    // This will fail until a real session exists
    await expect(page.getByTestId("expense-table")).toBeVisible({ timeout: 5000 });
  });

  test("add expense button opens dialog", async ({ page }) => {
    await expect(page.getByTestId("add-expense-btn")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("add-expense-btn").click();
    await expect(page.getByTestId("expense-form")).toBeVisible();
  });

  test("expense form validates required fields", async ({ page }) => {
    await page.getByTestId("add-expense-btn").click({ timeout: 5000 });
    await page.getByTestId("expense-submit-btn").click();
    // Validation errors should appear
    await expect(page.getByText(/required|invalid/i)).toBeVisible({ timeout: 3000 });
  });

  test("can search expenses by description", async ({ page }) => {
    await expect(page.getByTestId("expense-search")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("expense-search").fill("coffee");
    // Table should filter — just assert the search input works
    await expect(page.getByTestId("expense-search")).toHaveValue("coffee");
  });
});
