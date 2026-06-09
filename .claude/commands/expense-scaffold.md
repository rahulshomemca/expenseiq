# /expense-scaffold

Scaffold all boilerplate for a new expense-domain feature in ExpenseIQ.

**Usage:** `/expense-scaffold <FeatureName>`

Example: `/expense-scaffold RecurringExpense`

---

You are scaffolding a new expense-domain feature called **$ARGUMENTS** in the ExpenseIQ project.

Follow these steps in order. Use the exact file paths and naming conventions defined in CLAUDE.md.

## 1. Derive Names

From the argument `$ARGUMENTS`, derive:
- `noun` — camelCase singular (e.g., `recurringExpense`)
- `Noun` — PascalCase singular (e.g., `RecurringExpense`)
- `nouns` — camelCase plural (e.g., `recurringExpenses`)
- `kebab` — kebab-case (e.g., `recurring-expense`)
- `route` — URL path (e.g., `/recurring-expenses`)

## 2. Prisma Model Stub

Append a placeholder model to `prisma/schema.prisma`:

```prisma
model <Noun> {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // TODO: add domain-specific fields here

  @@index([userId])
  @@map("<kebab>s")
}
```

Then run: `npx prisma migrate dev --name add-<kebab>-model`

## 3. Zod Schema

Create `src/lib/validations/<noun>Schema.ts`:

```typescript
import { z } from "zod";

export const <noun>Schema = z.object({
  // TODO: define fields
});

export type <Noun> = z.infer<typeof <noun>Schema>;
```

## 4. Server Actions

Create `src/lib/actions/<nouns>.ts` with stubs for:
- `create<Noun>(input: unknown): Promise<<Noun>>`
- `update<Noun>(id: string, input: unknown): Promise<<Noun>>`
- `delete<Noun>(id: string): Promise<void>`
- `get<Nouns>(): Promise<<Noun>[]>`

Each stub must include the auth guard and Zod parse pattern from CLAUDE.md.

## 5. Query Keys

Add to `src/lib/queries/keys.ts`:

```typescript
export const <noun>Keys = {
  all: ["<nouns>"] as const,
  list: () => [...<noun>Keys.all, "list"] as const,
  detail: (id: string) => [...<noun>Keys.all, "detail", id] as const,
};
```

## 6. Components

Create these files with minimal stubs:
- `src/components/<kebab>s/<Noun>Form.tsx`
- `src/components/<kebab>s/<Noun>Card.tsx`
- `src/components/<kebab>s/<Noun>List.tsx`

Each stub should render `<div data-testid="<kebab>-form">TODO</div>` etc.

## 7. Page

Create `src/app/(dashboard)/<nouns>/page.tsx`:

```typescript
import { <Noun>List } from "@/components/<kebab>s/<Noun>List";

export default function <Noun>sPage() {
  return (
    <main>
      <h1 className="text-2xl font-bold mb-6"><Noun>s</h1>
      <<Noun>List />
    </main>
  );
}
```

## 8. Test Stubs

Create:
- `src/lib/actions/<nouns>.test.ts` — Vitest integration test stub with TODO comments
- `tests/e2e/<nouns>.spec.ts` — Playwright E2E stub with TODO comments
- `tests/e2e/pages/<Noun>Page.ts` — Page Object Model stub

## 9. Final Check

```bash
npm run typecheck   # must pass with zero errors
npm run lint        # must pass
```

Print a summary of all files created and remind the user to:
1. Fill in the TODO domain fields in `schema.prisma`.
2. Run the migration again after filling in fields.
3. Implement the server action bodies.
4. Complete the component stubs.
