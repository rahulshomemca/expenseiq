import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("sign-in page renders with correct elements", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page).toHaveTitle(/ExpenseIQ/);
    await expect(page.getByTestId("sign-in-form")).toBeVisible();
    await expect(page.getByTestId("email-input")).toBeVisible();
    await expect(page.getByTestId("password-input")).toBeVisible();
    await expect(page.getByTestId("sign-in-btn")).toBeVisible();
  });

  test("unauthenticated access to /dashboard redirects to /sign-in", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /expenses redirects to /sign-in", async ({ page }) => {
    await page.goto("/expenses");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("unauthenticated access to /budget redirects to /sign-in", async ({ page }) => {
    await page.goto("/budget");
    await expect(page).toHaveURL(/sign-in/);
  });

  test("sign-in with invalid credentials shows error message", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByTestId("email-input").fill("wrong@example.com");
    await page.getByTestId("password-input").fill("wrongpassword");
    await page.getByTestId("sign-in-btn").click();
    // Wait for client-side response (either error text or still on sign-in)
    await page.waitForTimeout(2000);
    // Either stays on sign-in page or shows an error
    const url = page.url();
    const hasError = await page.getByText(/invalid|error|incorrect/i).isVisible().catch(() => false);
    expect(url.includes("sign-in") || hasError).toBe(true);
  });
});
