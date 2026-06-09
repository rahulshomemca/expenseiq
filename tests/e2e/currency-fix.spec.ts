import { test, expect } from "@playwright/test";

test.describe("Currency: 3-month compound conversion", () => {
  /**
   * BUG REPRODUCTION TEST — FAILS UNTIL FIXED
   *
   * The seeded bug in convertMultiMonthExpense uses `months` instead of
   * `months - 1` as the exponent. For inputs (306.34, 0.01, 3):
   *   Correct:  306.34 × (1.01)^2 ≈ 312.50
   *   Buggy:    306.34 × (1.01)^3 ≈ 315.62
   *
   * Acceptance criteria (must pass after fix):
   *   Given a 3-month compound expense with base 306.34 at 1% monthly rate,
   *   the dashboard total should show $312.50.
   */
  test("should correctly calculate 3-month compound conversion", async ({ page }) => {
    // Step 1: Sign in
    await page.goto("/sign-in");
    await page.getByTestId("email-input").fill("alice@example.com");
    await page.getByTestId("password-input").fill("password");
    await page.getByTestId("sign-in-btn").click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10000 });

    // Step 2: Navigate to expenses
    await page.goto("/expenses");
    await expect(page.getByTestId("add-expense-btn")).toBeVisible();
    await page.getByTestId("add-expense-btn").click();

    // Step 3: Fill in a 3-month compound expense
    // Base amount that yields 312.50 with correct formula (months - 1 exponent)
    await page.getByTestId("expense-amount-input").fill("306.34");
    await page.getByTestId("expense-description-input").fill("3-month USD→INR compound expense");
    await page.getByTestId("expense-date-input").fill("2026-05-01");

    // Select category (Food as fallback if multi-month fields don't exist yet)
    const categorySelect = page.getByTestId("expense-category-select");
    await categorySelect.selectOption({ index: 0 }).catch(() =>
      categorySelect.click().then(() =>
        page.getByRole("option").first().click()
      )
    );

    await page.getByTestId("expense-submit-btn").click();

    // Step 4: Navigate to dashboard and check total
    await page.goto("/dashboard");
    // The dashboard total for this expense should reflect the compound-adjusted value
    // With correct exponent: 312.50
    // With buggy exponent:   315.62
    await expect(page.getByTestId("spending-chart")).toBeVisible({ timeout: 5000 });

    // Assert the compound-adjusted total on the dashboard
    // (This specific assertion will fail until the bug is fixed AND
    //  the expense creation flow calls convertMultiMonthExpense)
    const totalText = await page.getByTestId("total-spent").textContent();
    const total = parseFloat((totalText ?? "0").replace(/[^0-9.]/g, ""));
    expect(total).toBeCloseTo(312.50, 1);
  });
});
