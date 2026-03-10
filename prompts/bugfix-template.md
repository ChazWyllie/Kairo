# Bugfix Process

## Step 1 — Root cause analysis
- Reproduce the bug with exact steps
- Identify the failing component and the reason it fails
- Determine scope: is this isolated or does it affect other paths?

## Step 2 — Write a failing test
- Add a test that captures the broken behaviour before touching the fix
- Commit or note it separately so the regression is documented

## Step 3 — Minimal fix
- Make the smallest safe change that resolves the root cause
- Avoid refactoring surrounding code unless it is required for the fix

## Step 4 — Validation
- Re-run the full test suite (`cd app/kairo-web && npx vitest run`)
- Check related edge cases (fallback paths, error states, boundary inputs)
- Confirm no TypeScript errors (`npx tsc --noEmit`)

## Step 5 — Commit and PR

### Commit message format
```
fix(<bug-id>): <short imperative summary>

<what was broken and why>
<what the fix does>
<any backward-compat or migration notes>

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
```

### Branch naming
```
fix/<bug-id>-<slug>   e.g. fix/bb-008-billing-toggle
```

### PR body (use pr-template.md)
Fill in all sections. Under **Risks**, list the top 3 regression scenarios
and how a reviewer can detect them.

## Step 6 — Report summary
Include in the PR or a comment:
- Root cause (one sentence)
- Files changed and why
- Risk assessment (low / medium / high) with rationale
- Any follow-up work or lint rules recommended
