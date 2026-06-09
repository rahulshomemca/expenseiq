# ExpenseIQ — Claude Code Feature Showcase

This file is the one-stop guide to every Claude Code feature wired into this project.
Each section maps a feature to its file location and explains what it does.

---

## Table of Contents

1. [Project Context — CLAUDE.md](#1-project-context--claudemd)
2. [Subagents (6)](#2-subagents-6)
3. [Skills (5)](#3-skills-5)
4. [Slash Commands (2)](#4-slash-commands-2)
5. [MCP Servers (4)](#5-mcp-servers-4)
6. [Hooks (7)](#6-hooks-7)
7. [GitHub Actions (2)](#7-github-actions-2)
8. [GitHub Templates](#8-github-templates)
9. [Test Suite](#9-test-suite)
10. [Bug → Fix Pipeline Demo](#10-bug--fix-pipeline-demo)

---

## 1. Project Context — CLAUDE.md

| File | Purpose |
|---|---|
| [`CLAUDE.md`](./CLAUDE.md) | Loaded into every Claude Code session. Documents the full stack, directory layout, architecture decisions, code conventions, common commands, and known gotchas. Claude reads this before every response in this repo. |

**Key sections inside CLAUDE.md:**
- Tech stack table (Next.js 15 App Router, Prisma 7, NextAuth v5, Tailwind v4, shadcn/ui, Recharts, Zod, TanStack Query)
- Server vs. Client component rules
- Auth split: edge-safe `authConfig` in `auth.config.ts` vs. full `auth` in `auth.ts`
- Prisma 7 driver-adapter pattern (`PrismaPg` + `prisma-client` generator)
- Mutation pattern: server actions → `revalidatePath`, never `fetch()` in Client Components

---

## 2. Subagents (6)

Stored in `.claude/agents/`. Each file is a YAML-frontmatter Markdown that defines a specialised Claude agent. Invoke via the `Agent` tool with the matching name.

| File | Agent Name | When to use |
|---|---|---|
| [`.claude/agents/db-agent.md`](./.claude/agents/db-agent.md) | `db-agent` | Prisma schema changes, migrations, seed scripts, query optimisation. Owns `schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `src/lib/db.ts`. |
| [`.claude/agents/github-agent.md`](./.claude/agents/github-agent.md) | `github-agent` | Creating/reviewing PRs, managing issues, checking CI status, branch workflows. Uses `gh` CLI and the GitHub MCP server. |
| [`.claude/agents/playwright-agent.md`](./.claude/agents/playwright-agent.md) | `playwright-agent` | Writing and running Playwright E2E tests, Page Object Models, screenshots, accessibility. Uses the Playwright MCP server for live browser control. |
| [`.claude/agents/security-agent.md`](./.claude/agents/security-agent.md) | `security-agent` | Security reviews: auth flows, input validation, dependency audits, OWASP Top 10. Read-heavy; never applies fixes directly. |
| [`.claude/agents/test-agent.md`](./.claude/agents/test-agent.md) | `test-agent` | Vitest unit and integration tests. Scaffolding, assertion patterns, mock strategy, coverage configuration. |
| [`.claude/agents/ui-agent.md`](./.claude/agents/ui-agent.md) | `ui-agent` | React/Next.js UI components, shadcn/ui composition, Recharts charts, accessibility, React Hook Form patterns. |

**Each agent file contains:**
```yaml
---
name: <agent-name>
description: >-
  <when to invoke — used by Claude to auto-select the right agent>
model: claude-opus-4-8   # or sonnet-4-6 for lighter tasks
---
# System prompt follows …
```

---

## 3. Skills (5)

Stored in `.claude/skills/<skill-name>/SKILL.md`. Skills are reusable multi-step procedures that Claude follows verbatim when invoked with `/skill-name`.

| Directory | Skill | What it does |
|---|---|---|
| [`.claude/skills/add-expense-feature/`](./.claude/skills/add-expense-feature/SKILL.md) | `/add-expense-feature` | Scaffolds a complete vertical slice: Prisma schema change → migration → server action → Zod schema → UI component → Vitest tests. |
| [`.claude/skills/db-migrate/`](./.claude/skills/db-migrate/SKILL.md) | `/db-migrate` | Safely creates and applies a Prisma migration: checks for pending changes, names the migration with `verb-noun` convention, verifies with `prisma validate`. |
| [`.claude/skills/fix-bug/`](./.claude/skills/fix-bug/SKILL.md) | `/fix-bug` | Diagnoses a confirmed bug guided by failing tests: reads the failing test, locates the source, applies the minimal fix, re-runs tests to verify green. Used by the `claude-agent.yml` workflow. |
| [`.claude/skills/review-pr/`](./.claude/skills/review-pr/SKILL.md) | `/review-pr` | Performs a structured PR review: checks diff for security issues, type safety, test coverage, convention compliance, and performance. Posts a summary. |
| [`.claude/skills/seed-bug/`](./.claude/skills/seed-bug/SKILL.md) | `/seed-bug` | Plants a non-obvious, detectable bug for testing purposes (used to demonstrate the full bug→fix pipeline). Seeded the off-by-one in `convertMultiMonthExpense`. |

---

## 4. Slash Commands (2)

Stored in `.claude/commands/`. These are lightweight slash commands that provide quick-access templates for common tasks.

| File | Command | Purpose |
|---|---|---|
| [`.claude/commands/expense-scaffold.md`](./.claude/commands/expense-scaffold.md) | `/expense-scaffold <FeatureName>` | Generates all boilerplate for a new expense-domain feature: Zod schema, server action, React component, and test file stubs. |
| [`.claude/commands/gh-issue.md`](./.claude/commands/gh-issue.md) | `/gh-issue <title>` | Creates a well-structured GitHub issue from current context: auto-generates description, steps to reproduce, and assigns the appropriate label. |

---

## 5. MCP Servers (4)

Configured in [`.claude/.mcp.json`](./.claude/.mcp.json). MCP (Model Context Protocol) servers extend Claude's tool access beyond the built-in tools.

| Server | Package | What Claude can do |
|---|---|---|
| `github` | `@modelcontextprotocol/server-github` | Read/write GitHub issues, PRs, comments, labels, and repo data. Requires `GITHUB_PERSONAL_ACCESS_TOKEN` env var. |
| `playwright` | `@playwright/mcp` | Control a real Chromium browser: navigate, click, fill forms, take screenshots, assert DOM state — live during a session. |
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Scoped read/write access to `/Users/rahulshome/Documents/code/expenseiq` — safe local file operations. |
| `fetch` | `@modelcontextprotocol/server-fetch` | Make HTTP requests to `localhost`, `github.com`, and `api.github.com`. Used for API smoke tests and CI status checks. |

**To activate:** MCP servers start automatically when Claude Code opens this project. The `${GITHUB_PERSONAL_ACCESS_TOKEN}` placeholder is resolved from your shell environment.

---

## 6. Hooks (7)

Configured in [`.claude/settings.json`](./.claude/settings.json). Hooks run shell commands automatically when specific Claude tool events fire.

| Event | Trigger | What it does |
|---|---|---|
| `PreToolUse[Bash]` | Any `Bash` call | Blocks `prisma migrate reset`, `DROP TABLE`, `DROP DATABASE`, `DROP SCHEMA` — prevents accidental destructive operations. Exits with code 2 to hard-block. |
| `PreToolUse[Write\|Edit]` | Any file write/edit | Warns when editing `.env` directly and reminds to update `.env.example` instead. |
| `PostToolUse[Write\|Edit]` | After any file write/edit | Runs `prettier --write` on `.ts`, `.tsx`, `.js`, `.jsx`, `.css`, `.json` files — keeps formatting consistent automatically. |
| `PostToolUse[Write\|Edit]` | After any file write/edit | Detects edits to `schema.prisma` and auto-runs `npx prisma generate` — keeps the generated client in sync. |
| `PostToolUse[Bash]` | After any `Bash` call | Detects test output (PASS/FAIL/✓/✗) and prints a concise test summary — so test results are visible without scrolling. |
| `Stop` | When Claude finishes a turn | Runs `tsc --noEmit` and prints any type errors — catches TypeScript regressions before the user sees the result. |
| `Notification` | When Claude needs attention | Fires a macOS `osascript` notification with sound — lets you context-switch away and get pinged when Claude is done. |

---

## 7. GitHub Actions (2)

Stored in `.github/workflows/`.

### [`ci.yml`](./.github/workflows/ci.yml) — Continuous Integration

Triggers on every `push` and `pull_request` to `main`. Four sequential jobs:

```
lint  →  typecheck  →  vitest  →  playwright
```

| Job | Tools | Notes |
|---|---|---|
| `lint` | ESLint | ubuntu-latest, Node 22, `npm run lint` |
| `typecheck` | tsc | Generates Prisma client first, then `npm run typecheck` |
| `vitest` | Vitest + PostgreSQL 15 | Service container; `prisma db push` to apply schema; `npm run test:run` |
| `playwright` | Playwright + PostgreSQL 15 | Service container; seeds DB; starts dev server; `npx wait-on`; uploads report artifact on failure |

### [`claude-agent.yml`](./.github/workflows/claude-agent.yml) — Automated Claude Fix

Triggers when an issue is **labeled** with `claude-fix`.

```
checkout → install deps → install claude → run /fix-bug → branch → commit → push → open PR → comment
```

Steps:
1. Installs Claude Code CLI globally: `npm install -g @anthropic-ai/claude-code`
2. Runs `claude --headless "/fix-bug"` with `ANTHROPIC_API_KEY` from secrets
3. Creates branch `claude-fix/issue-N`, commits any changes
4. Opens a PR via `gh pr create`
5. Comments on the original issue with the PR link

**Required secrets:** `ANTHROPIC_API_KEY` in repository settings.

---

## 8. GitHub Templates

### [`bug_report.yml`](./.github/ISSUE_TEMPLATE/bug_report.yml) — Structured Bug Report Form

A GitHub issue form (not a Markdown template) with required fields:

| Field | Type | Purpose |
|---|---|---|
| Short description | Input | One-line summary, pre-fills the issue title |
| Description | Textarea | Full reproduction context |
| Steps to Reproduce | Textarea | Numbered steps |
| Expected behavior | Input | What should happen |
| Actual behavior | Input | What actually happens |
| Severity | Dropdown | Critical / High / Medium / Low |
| Environment | Textarea | Optional browser/OS/Node context |

### [`pull_request_template.md`](./.github/pull_request_template.md) — PR Checklist

Sections: **Summary** · **Changes** · **Test Evidence** (code block) · **Linked Issue** (`Closes #`) · **Checklist** (8 items covering tests, lint, typecheck, secrets, `data-testid`, `revalidatePath`, migrations, and Server Components).

---

## 9. Test Suite

### Unit Tests (Vitest)

| File | Tests | Coverage target |
|---|---|---|
| [`src/lib/currency.test.ts`](./src/lib/currency.test.ts) | 11 tests — regression guard for `convertMultiMonthExpense` | `src/lib/currency.ts` |
| [`src/__tests__/currency.test.ts`](./src/__tests__/currency.test.ts) | 13 tests — named test `should correctly calculate 3-month compound conversion` | `src/lib/currency.ts` |
| [`src/__tests__/budget.test.ts`](./src/__tests__/budget.test.ts) | 10 tests — pure budget utility functions | `src/lib/budget.ts` |
| [`src/__tests__/actions.test.ts`](./src/__tests__/actions.test.ts) | 17 tests — all server actions with mocked Prisma + auth | `src/lib/actions/` |

**Coverage** (`npx vitest run --coverage`): 91% statements · 84% branches · 90% functions · 94% lines

**Run:** `npm run test:run`

### E2E Tests (Playwright)

| File | Tests | Status without DB |
|---|---|---|
| [`tests/e2e/auth.spec.ts`](./tests/e2e/auth.spec.ts) | Sign-in page, redirect guards, invalid credentials | ✅ All pass |
| [`tests/e2e/expenses.spec.ts`](./tests/e2e/expenses.spec.ts) | Expense list, add/delete, search | ⏳ Needs DB + auth |
| [`tests/e2e/budget-alerts.spec.ts`](./tests/e2e/budget-alerts.spec.ts) | Budget progress bars, over-budget styling | ⏳ Needs DB + auth |
| [`tests/e2e/currency-fix.spec.ts`](./tests/e2e/currency-fix.spec.ts) | 3-month compound conversion shows 312.50 | ⏳ Needs DB + auth |
| [`tests/e2e/mcp-github.spec.ts`](./tests/e2e/mcp-github.spec.ts) | Issue #1 exists and is closed via GitHub API | ✅ Passes with `GITHUB_PERSONAL_ACCESS_TOKEN` |

**Run:** `npm run test:e2e`
**Run with GitHub token:** `GITHUB_PERSONAL_ACCESS_TOKEN=$(gh auth token) npm run test:e2e`

---

## 10. Bug → Fix Pipeline Demo

This project ships with a live demonstration of the complete Claude Code agentic pipeline:

### The Bug
`src/lib/currency.ts` — `convertMultiMonthExpense` used `months` instead of `months - 1` as the compound interest exponent. One extra period of growth was applied, inflating all multi-month results.

```typescript
// Buggy (line 45, original commit 04fc0b2):
return baseAmount * Math.pow(1 + monthlyRate, months);

// Fixed (commit 3a06f66, merged in PR #2):
return baseAmount * Math.pow(1 + monthlyRate, months - 1);
```

### The Pipeline

| Step | Agent | Artifact |
|---|---|---|
| 1. Issue created | `github-agent` | [Issue #1](https://github.com/rahulshomemca/expenseiq/issues/1) — labeled `bug`, `claude-fix`, `priority: high` |
| 2. Failing tests | `test-agent` | `should correctly calculate 3-month compound conversion` → expected 312.50, got 315.62 |
| 3. Fix applied | `db-agent` (logic) | `src/lib/currency.ts:45` — one character changed |
| 4. Tests green | `test-agent` | 40/40 → 51/51 pass |
| 5. E2E attempted | `playwright-agent` | Blocked at sign-in (no local DB) — passes in CI |
| 6. PR merged | `github-agent` | [PR #2](https://github.com/rahulshomemca/expenseiq/pull/2) squash-merged, issue auto-closed |
| 7. Verified closed | `playwright-agent` | `mcp-github.spec.ts` → `issue.state === "closed"` ✅ |

### Reproducing the demo

```bash
# 1. Reset to the buggy state
git checkout 04fc0b2 -- src/lib/currency.ts

# 2. Confirm tests fail
npm run test:run   # → 4 failures

# 3. Run the fix skill
claude -p "/fix-bug"

# 4. Confirm all tests pass
npm run test:run   # → 51 passed
```

---

## Quick Reference

```bash
# Start Claude Code in this project
claude

# Invoke a skill
/fix-bug
/add-expense-feature ExpenseTag

# Run a subagent
# (done by Claude internally — e.g. "use db-agent to add a tags column")

# Run tests
npm run test:run                          # Vitest (unit)
npm run test:e2e                          # Playwright (E2E)
npx vitest run --coverage                 # With coverage report

# Trigger the automated fix workflow
gh issue edit <number> --add-label "claude-fix"

# View CI
gh run list --limit 10
gh run view <run-id>
```

---

*Generated by Claude Sonnet 4.6 · ExpenseIQ v1.0.0-showcase · 2026-06-09*
