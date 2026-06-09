# Skill: db-migrate

Safely create, apply, and verify a Prisma database migration.

## When to Use

Invoke whenever you need to change the database schema: adding a column,
creating a model, renaming a field, adding an index, or setting a default.

## Steps

### 1. Review Current Schema

Read `prisma/schema.prisma` in full before making changes. Understand:
- Existing models and their relationships.
- Existing indexes and constraints.
- Which fields are required vs. optional.

### 2. Plan the Migration

Answer before touching any file:
- Does this add a required column to an existing table with data? If yes, plan a default value or a multi-step migration.
- Does this rename a field? Prisma will drop + recreate — consider a two-step migration if data must be preserved.
- Does this remove a model? Confirm nothing in application code still references it.

### 3. Edit the Schema

Modify `prisma/schema.prisma` with the minimum necessary changes.

**Adding a required column with a default:**
```prisma
model Expense {
  // existing fields...
  currency String @default("USD")
}
```

**Adding a nullable column (safest for existing data):**
```prisma
model Expense {
  // existing fields...
  receiptUrl String?
}
```

**Adding an index:**
```prisma
model Expense {
  // ...
  @@index([userId, createdAt(sort: Desc)])
}
```

### 4. Create and Apply the Migration

```bash
npx prisma migrate dev --name <verb-noun>
```

Examples of good migration names:
- `add-receipt-url-to-expense`
- `make-category-nullable`
- `add-expense-user-index`
- `create-budget-model`

Prisma will print the generated SQL — **read it** and confirm it looks correct before proceeding.

### 5. Regenerate the Client

```bash
npx prisma generate
```

The PostToolUse hook may do this automatically, but run it manually to confirm.

### 6. Update Seed Data (if needed)

If you added a required field or a new model, update `prisma/seed.ts` to include
sample data for the new field/model.

```bash
npx prisma db seed
```

Verify the seed runs without errors.

### 7. Fix TypeScript Breakage

```bash
npm run typecheck
```

New or renamed fields will cause TypeScript errors in server actions and
components that reference the old schema. Fix all errors before continuing.

### 8. Verify the Migration in Prisma Studio

```bash
npx prisma studio
```

Open `localhost:5555`, navigate to the affected table, and confirm the schema
and data look correct.

### 9. Test

```bash
npm run test:run    # Unit and integration tests still pass
```

If integration tests fail due to schema changes, update the test fixtures and
seed data to match the new schema.

## Rollback

If the migration introduced a regression, create a **new forward migration** that
reverts the change — do not delete the migration file. Example:

```bash
npx prisma migrate dev --name revert-add-receipt-url
```

Then reverse the change in `schema.prisma`.

## Multi-Step Migration (Adding Required Column to Live Table)

```
Step 1: Add column as nullable
  → npx prisma migrate dev --name add-currency-nullable

Step 2: Backfill existing rows (in seed or a one-off script)
  → UPDATE "Expense" SET currency = 'USD' WHERE currency IS NULL

Step 3: Make column required
  → npx prisma migrate dev --name make-currency-required
```
