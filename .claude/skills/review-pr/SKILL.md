# Skill: review-pr

Perform a thorough code review of a pull request in the ExpenseIQ repository.

## When to Use

Invoke when asked to review a PR — either by PR number or by inspecting a
local branch diff. Covers correctness, security, conventions, test coverage,
and performance.

## Steps

### 1. Understand the Intent

Read the PR description:
- What problem does it solve?
- Is there a linked issue (`closes #n`)?
- Are there screenshots for UI changes?
- Does the test plan cover the acceptance criteria?

```bash
gh pr view <number> --comments
```

### 2. Fetch and Diff the Branch

```bash
git fetch origin
git diff main...origin/<branch-name> --stat   # overview of changed files
git diff main...origin/<branch-name>          # full diff
```

Or check out locally for deeper inspection:
```bash
gh pr checkout <number>
```

### 3. Review Each Changed File

For every changed file, check:

**Server Actions (`src/lib/actions/`)**
- [ ] Auth check at the top: `const session = await auth(); if (!session) throw ...`
- [ ] Input validated with Zod before touching DB
- [ ] Prisma queries scoped to `userId: session.user.id`
- [ ] `revalidatePath()` / `revalidateTag()` called after mutation
- [ ] No raw `$queryRaw` with string interpolation

**Components (`src/components/`)**
- [ ] No `fetch()` calls inside client components — data comes from props or TanStack Query
- [ ] `data-testid` on all interactive elements
- [ ] Form uses React Hook Form + `zodResolver`
- [ ] No inline styles or hardcoded colours
- [ ] Accessible labels and ARIA attributes

**Schema (`prisma/schema.prisma`)**
- [ ] Migration was created (not just a schema edit with no migration file)
- [ ] Required new columns have defaults for existing data
- [ ] Indexes added for columns used in `where` clauses

**Tests**
- [ ] New behaviour has test coverage (unit + E2E for user-facing features)
- [ ] No Prisma mocks — real test DB used
- [ ] Tests use `data-testid` selectors (Playwright)

**General**
- [ ] No default exports introduced
- [ ] No barrel `index.ts` files added
- [ ] No secrets or credentials in diff
- [ ] `npm run typecheck` and `npm run lint` pass

### 4. Run the Tests Locally

```bash
git fetch origin && gh pr checkout <number>
npm install                  # in case new deps were added
npm run typecheck
npm run lint
npm run test:run
npm run test:e2e
```

### 5. Build

```bash
npm run build
```

A failing build is a blocking issue regardless of test results.

### 6. Write the Review

Structure feedback as:

**Blocking** — must be resolved before merge
**Non-blocking** — should be a follow-up issue
**Nit** — style preference, no action required

Use line-specific comments where possible:
```bash
gh pr review <number> --comment --body "..."
# or post inline comments via the GitHub MCP tool
```

### 7. Approve or Request Changes

```bash
gh pr review <number> --approve --body "LGTM"
# or
gh pr review <number> --request-changes --body "..."
```

## Severity Reference

| Label | Meaning |
|---|---|
| `[BLOCK]` | Security issue, data loss risk, or build-breaking |
| `[MUST]` | Convention violation or missing test for new behaviour |
| `[SHOULD]` | Best-practice deviation, performance concern |
| `[NIT]` | Formatting or minor style preference |
