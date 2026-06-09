# Skill: fix-bug

Diagnose and fix a confirmed bug in ExpenseIQ, guided by a failing test.

## When to Use

Invoke after `seed-bug` has created a failing test, or when a failing test
already exists. The goal is to find the root cause and apply the minimum
change that makes the test pass without breaking anything else.

## Prerequisites

- A failing test that accurately describes the bug.
- The test fails for the right reason (not a setup error).
- The test is committed or staged.

## Steps

### 1. Read the Failing Test

Understand exactly what the test asserts. The test is the specification.

```bash
npx vitest run --reporter=verbose <path-to-test>
```

Read the failure output carefully:
- What value was received?
- What value was expected?
- At which line did it fail?

### 2. Locate the Root Cause

Trace the execution path from the test's entry point to the failure:

1. Identify the function/action being tested.
2. Read the implementation in full.
3. Look for the divergence between what the code does and what the test expects.

Common root causes in ExpenseIQ:
- Missing `userId` filter in a Prisma query (auth bypass)
- Zod schema missing a constraint or coercion
- Server action not calling `revalidatePath()` after mutation
- Client component calling a server action without awaiting
- TanStack Query key mismatch causing stale cache

Use targeted grep to trace:
```bash
grep -rn "functionName" src/
```

### 3. Apply the Minimum Fix

Fix only what the failing test covers. Resist the urge to refactor adjacent code.

**Before fixing**, note the exact lines you plan to change. State the reasoning:
> "The query in `deleteExpense` filters by `id` but not `userId`, allowing
> any authenticated user to delete any record."

**After fixing**, re-read the changed lines and confirm the logic is correct.

### 4. Run the Target Test

```bash
npx vitest run --reporter=verbose <path-to-failing-test>
```

The test must now pass. If it still fails, re-examine the root cause.

### 5. Run the Full Test Suite

```bash
npm run test:run
npm run test:e2e
```

If new failures appear, you either:
- Broke something with the fix (narrow the change), or
- Revealed a related bug (open a separate issue — don't fix it here).

### 6. Type-Check and Lint

```bash
npm run typecheck
npm run lint
```

Zero errors required.

### 7. Commit the Fix

Commit message format:
```
fix: <concise description of what was wrong>

Closes #<issue-number> (if applicable)
```

Example:
```
fix: scope deleteExpense to the authenticated user's records

Previously the Prisma query only filtered by `id`, allowing any
authenticated user to delete another user's expense.
```

### 8. Verify in Prisma Studio (for DB bugs)

For bugs involving incorrect data or missing records:

```bash
npx prisma studio
```

Inspect the affected table to confirm the fix behaves correctly against real data.

## Pitfalls to Avoid

- **Fixing the test to match the broken behaviour** — never do this.
- **Over-engineering the fix** — one failing test → one minimal fix.
- **Skipping the full test suite** — regressions are common with auth/Prisma changes.
- **Committing a `console.log`** left in from debugging.
