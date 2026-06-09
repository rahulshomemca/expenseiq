## Summary

<!-- 1–3 sentences: what does this PR do and why? -->

## Changes

<!-- Bullet list of specific changes. Be concrete — file paths, function names. -->

- 

## Test Evidence

<!-- Paste relevant test output, screenshots, or curl responses that prove the change works.
     For bug fixes, show the failing test before and the passing test after. -->

```
# test output here
```

## Linked Issue

Closes #<!-- issue number -->

## Checklist

- [ ] `npm run test:run` — all unit/integration tests pass
- [ ] `npm run lint` — no lint errors
- [ ] `npm run typecheck` — TypeScript compiles cleanly
- [ ] No `.env` or secrets committed
- [ ] `data-testid` attributes added to all new interactive elements
- [ ] Server actions call `revalidatePath()` / `revalidateTag()` after mutations
- [ ] New Prisma schema changes have a migration (`npx prisma migrate dev --name <verb-noun>`)
- [ ] New components default to Server Components; `"use client"` added only where needed
