# Skill: seed-bug

Create a minimal, reproducible test case that demonstrates a bug before
attempting to fix it.

## When to Use

Invoke when a bug has been reported but does not yet have a failing test.
The goal is to encode the bug as a failing test so that:
1. The reproduction is exact and deterministic.
2. The fix can be verified by making the test green.
3. The test prevents future regressions.

## Steps

### 1. Understand the Bug

Gather:
- What is the **observed behaviour**? (what actually happens)
- What is the **expected behaviour**? (what should happen)
- What are the **exact steps to reproduce**? (inputs, state, preconditions)
- Is it server-side (action/DB), client-side (component/form), or E2E?

### 2. Choose the Right Test Layer

| Bug type | Test layer | File location |
|---|---|---|
| Server action returns wrong value | Vitest integration | `src/lib/actions/<action>.test.ts` |
| Zod schema rejects valid input | Vitest unit | `src/lib/validations/<schema>.test.ts` |
| Component renders incorrectly | Vitest component | `src/components/<name>.test.tsx` |
| Full user flow broken | Playwright E2E | `tests/e2e/<feature>.spec.ts` |

### 3. Write the Minimal Failing Test

Create the smallest test that demonstrates the bug without anything extra.

**Server action example:**
```typescript
test("deleteExpense does not delete another user's expense", async () => {
  // Seed two users and one expense belonging to user B
  const userA = await db.user.create({ data: { email: "a@test.com" } });
  const userB = await db.user.create({ data: { email: "b@test.com" } });
  const expense = await db.expense.create({
    data: { amount: 10, userId: userB.id, category: "Food" },
  });

  // Attempt to delete as user A — should be rejected
  await expect(deleteExpense(expense.id, userA.id)).rejects.toThrow("Not found");

  // Expense should still exist
  const found = await db.expense.findUnique({ where: { id: expense.id } });
  expect(found).not.toBeNull();
});
```

**Zod schema example:**
```typescript
test("expenseSchema rejects negative amounts", () => {
  const result = expenseSchema.safeParse({ amount: -5, category: "Food" });
  expect(result.success).toBe(false);
  expect(result.error?.issues[0].path).toContain("amount");
});
```

**Playwright example:**
```typescript
test("budget chart shows zero when no expenses in period", async ({ page }) => {
  // Seed: user with a budget but no expenses
  await request.post("/api/test/seed", { data: { scenario: "budget-no-expenses" } });
  await page.goto("/analytics");
  await expect(page.getByTestId("budget-bar-chart")).toContainText("$0");
});
```

### 4. Confirm the Test Fails

Run only the new test and confirm it fails **for the right reason**:

```bash
npx vitest run --reporter=verbose src/lib/actions/<action>.test.ts
# or
npx playwright test tests/e2e/<feature>.spec.ts --reporter=list
```

The failure message should clearly show the bug — if it fails with a different
error (e.g., a setup problem), fix the test setup first.

### 5. Document the Bug in the Test

Add a comment above the test that explains the bug:

```typescript
// Regression: deleteExpense previously checked `id` but not `userId`,
// allowing any authenticated user to delete any expense.
test("deleteExpense does not delete another user's expense", async () => {
```

### 6. Commit the Failing Test

Commit the failing test on its own, before the fix:

```bash
git add src/lib/actions/expenses.test.ts
git commit -m "test: reproduce deleteExpense auth bypass (failing)"
```

This makes the fix commit easy to review in isolation.

### 7. Hand Off to fix-bug Skill

With the failing test in place, invoke the `fix-bug` skill to resolve the issue.
