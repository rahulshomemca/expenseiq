# /gh-issue

Create a well-structured GitHub issue from the current context.

**Usage:** `/gh-issue <title>`

Example: `/gh-issue Budget chart shows wrong total when expenses span two months`

---

Create a GitHub issue for the ExpenseIQ repository using the title: **$ARGUMENTS**

## Steps

### 1. Gather Context

Before creating the issue, gather context from the current conversation and codebase:
- What is the observed problem or requested feature?
- Which files or components are involved?
- Is there a failing test, error message, or reproduction scenario?
- What is the expected behaviour?

### 2. Classify the Issue

Determine the appropriate label(s):
- `bug` — something is broken or incorrect
- `feature` — new functionality
- `chore` — maintenance, dependency update, refactor
- `security` — vulnerability or auth concern
- `docs` — documentation only
- `blocked` — waiting on something external

### 3. Draft the Issue Body

Use this template:

```markdown
## Description
<!-- Clear 1-2 sentence summary of what is wrong or what is needed -->

## Steps to Reproduce (bugs only)
1. Navigate to ...
2. Click ...
3. Observe ...

## Expected Behaviour
<!-- What should happen -->

## Actual Behaviour (bugs only)
<!-- What actually happens; include error messages verbatim -->

## Acceptance Criteria
- [ ] ...
- [ ] Tests cover the fix / feature
- [ ] `npm run typecheck` passes
- [ ] `npm run lint` passes

## Related Files
<!-- Paste file paths identified from context -->

## Additional Context
<!-- Screenshots, links, commit hashes, or other relevant info -->
```

### 4. Create the Issue

```bash
gh issue create \
  --title "$ARGUMENTS" \
  --body "..." \
  --label "<label>"
```

Or use the GitHub MCP tool `mcp__github__create_issue` if available.

### 5. Return the Issue URL

After creation, print the issue URL so it can be referenced in commits and PRs.

### 6. Link to Existing Work (if applicable)

If there is an open PR or branch that relates to this issue, add a comment linking them:

```bash
gh issue comment <number> --body "Related PR: #<pr-number>"
```
