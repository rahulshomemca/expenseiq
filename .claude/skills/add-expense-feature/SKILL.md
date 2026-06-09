# Skill: add-expense-feature

Add a complete vertical slice for a new expense-related feature — from the
Prisma schema through to the UI and tests.

## When to Use

Invoke this skill when adding any new domain concept or CRUD capability to
the ExpenseIQ expense/budget/analytics domain (e.g., receipt attachments,
recurring expenses, expense splitting, tags).

## Steps

### 1. Clarify Requirements

Before writing any code, answer:
- What data does this feature store? (new model, new columns, or neither?)
- What user actions does it expose? (create / read / update / delete)
- Which existing screens does it extend vs. which are new?
- Are there auth or permission implications?

### 2. Update the Prisma Schema (if needed)

Edit `prisma/schema.prisma` to add or extend models.

```bash
# After editing schema.prisma:
npx prisma migrate dev --name add-<feature-name>
npx prisma generate
```

Verify the migration applied cleanly and `npm run typecheck` still passes.

### 3. Define the Zod Validation Schema

Create `src/lib/validations/<noun>Schema.ts`:

```typescript
import { z } from "zod";

export const <noun>Schema = z.object({
  // Required fields with explicit constraints
  amount: z.number().positive().max(1_000_000),
  // Optional fields
  note: z.string().max(500).optional(),
});

export type <Noun> = z.infer<typeof <noun>Schema>;
```

### 4. Write Server Actions

Create `src/lib/actions/<noun>s.ts`. Each action must:
- Authenticate via `const session = await auth(); if (!session) throw new Error("Unauthorized");`
- Validate input with the Zod schema.
- Scope all DB queries to `userId: session.user.id`.
- Call `revalidatePath()` after mutations.

```typescript
"use server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { <noun>Schema } from "@/lib/validations/<noun>Schema";
import { revalidatePath } from "next/cache";

export async function create<Noun>(input: unknown) {
  const session = await auth();
  if (!session) throw new Error("Unauthorized");

  const data = <noun>Schema.parse(input);
  const record = await db.<noun>.create({
    data: { ...data, userId: session.user.id },
  });

  revalidatePath("/<noun>s");
  return record;
}
```

### 5. Add TanStack Query Key and Fetcher

Add the query key factory to `src/lib/queries/keys.ts`:

```typescript
export const <noun>Keys = {
  all: ["<noun>s"] as const,
  list: () => [...<noun>Keys.all, "list"] as const,
  detail: (id: string) => [...<noun>Keys.all, "detail", id] as const,
};
```

Create `src/lib/queries/<noun>s.ts` with a fetcher function.

### 6. Build the UI Components

Create components in `src/components/<noun>s/`:
- `<Noun>Form.tsx` — React Hook Form + Zod resolver form.
- `<Noun>Card.tsx` — display card.
- `<Noun>List.tsx` — list/table of records.

Add `data-testid` attributes to all interactive elements.

For new pages, create `src/app/(dashboard)/<noun>s/page.tsx`.

### 7. Write Vitest Unit Tests

Create `src/lib/actions/<noun>s.test.ts`:
- Test the happy path (valid input → persisted record).
- Test validation rejection (invalid input → Zod error).
- Test auth guard (no session → error).

Create `src/components/<noun>s/<Noun>Form.test.tsx`:
- Test form renders correctly.
- Test validation error display.
- Test submit calls the action.

### 8. Write Playwright E2E Test

Create `tests/e2e/<noun>s.spec.ts`:
- Happy path: user navigates → fills form → submits → sees result in list.
- Validation: user submits empty form → sees error messages.
- Auth: unauthenticated user is redirected to sign-in.

Add a Page Object Model in `tests/e2e/pages/<Noun>Page.ts`.

### 9. Final Checks

```bash
npm run typecheck     # Zero TypeScript errors
npm run lint          # Zero lint errors
npm run test:run      # All unit tests pass
npm run test:e2e      # E2E tests pass
npm run build         # Production build succeeds
```
