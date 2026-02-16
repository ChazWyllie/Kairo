---
applyTo: "**"
---

# Universal Engineering Standard (applies to all repos)

## Non-negotiable SDLC
Follow this loop for every task:
1) SPEC → 2) DIFF PLAN → 3) IMPLEMENT → 4) TEST → 5) REVIEW PACKAGE

Never skip steps. If repo-specific info is missing (build/test commands, architecture), ask for it or infer safely by inspecting common files (package.json, pyproject.toml, pom.xml, build.gradle, Makefile, etc).

## Safety + scope
- Prefer small, reviewable changes; avoid drive-by refactors.
- Constrain blast radius; isolate risky changes behind flags when possible.
- Never introduce secrets/tokens/keys.
- If a change is ambiguous, generate a patch/diff plan and ask for approval before applying.

## Verification is mandatory
- Run the repo’s standard checks (format/lint/typecheck/test/build) and report results.
- If you cannot run commands, list exact commands to run and expected outputs.

## Required final output (always)
Include:
- Summary: what changed and why
- Added / changed / removed (file-by-file)
- Issues encountered + fixes applied
- Tests: added/updated + commands run + results
- Manual validation steps
- Risks: top 3 regressions + how to detect
- Follow-ups: next small PR suggestions
