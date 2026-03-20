# Skill Discovery

Search this repository for proven patterns, repeated workflows, and high-value operations that are worth turning into reusable Claude Code skills (slash commands).

## What to Search

### 1. Prompt and Agent Files
- Read every file in `prompts/` and `agents/`
- For each file, assess: Is this a standalone, reusable operation or a one-off note?
- Flag files that define a clear workflow, persona, or output format — those are strong skill candidates

### 2. Documentation Workflows
- Read `docs/workflows/` and `docs/workpackages/`
- Look for repeated sequences of steps (plan → implement → review, etc.)
- Look for runbooks, checklists, and decision frameworks

### 3. Existing Skills
- List all files in `.claude/commands/` to see what skills already exist
- Avoid proposing duplicates — identify gaps instead

### 4. Codebase Patterns
- Check `package.json` scripts for common developer tasks (lint, test, build, migrate, seed)
- Check CI config (`.github/workflows/`) for recurring automation steps
- Check for Makefile, scripts/, or Taskfile if present
- Look for repeated patterns in code: common API shapes, validation schemas, error handling patterns

### 5. Docs Templates
- Read `docs/rfc-template.md`, `docs/checklists/`, `docs/definition-of-done.md`
- Templates with structured fill-in sections → strong skill candidates

## Evaluation Criteria

Score each candidate on:

| Criterion | Question |
|-----------|----------|
| Reusability | Would this be invoked more than once? |
| Clarity | Does it have a clear input and output? |
| Complexity savings | Does it encode non-obvious steps a developer would otherwise forget? |
| Proven | Is it based on an existing document/workflow, not invented? |
| Scope | Can it be completed in a single focused session? |

Minimum bar: score YES on at least 3 of 5 criteria.

## Output Format

After searching, produce a ranked list of skill candidates:

```
## Proposed Skills

### 1. /skill-name
Source: <file path>
Trigger: "When would a developer reach for this?"
What it does: <1-2 sentence description>
Input: <what the user provides>
Output: <what Claude produces>
Why it's useful: <what complexity it encodes>
Priority: High / Medium / Low

### 2. /skill-name
...
```

Then ask:
> "Which of these should I create? I can implement any or all of them."

## Constraints

- Do NOT create skills for one-off tasks specific to a single feature
- Do NOT propose skills that duplicate existing `.claude/commands/` files
- Do NOT propose skills without a clear source document — every skill should be based on proven content already in this repo
- Prefer skills that encode a *sequence of steps* or *decision framework*, not just a single prompt
