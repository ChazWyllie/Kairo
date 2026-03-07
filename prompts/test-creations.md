Here’s the workflow I’d recommend for your implementations:

Requirements agent → behavior matrix
Feed the agent your feature spec, user story, or desired implementation and make it output a structured test matrix first: happy path, boundary cases, invalid inputs, permission/auth cases, state transitions, idempotency/retries, dependency failures, and regression risks. This lines up with OpenAI’s “define success first” eval guidance and GitHub’s emphasis on wide scenario coverage.

Test-writer agent → tests only
Give a second agent permission to edit only test files. Its job is to turn that matrix into unit and integration tests using your project’s conventions. For Python, lean on pytest fixtures and parametrization so tests stay modular and scalable; use monkeypatch for external dependencies. For web UI, use Playwright for E2E because its generator can record flows, produce assertions, and prefer resilient locators; Playwright’s locator model and auto-waiting are designed specifically to reduce flaky failures.

Critic agent → review the tests
Run a separate evaluator on the generated tests before any implementation starts. Its job is to reject weak tests such as tautological assertions, tests that mirror implementation instead of behavior, over-mocked tests, snapshot-heavy tests without semantic checks, and tests that never truly fail. This is exactly the kind of evaluator-optimizer loop Anthropic recommends, and it matches OpenAI’s advice to review model-written tests for shortcuts.

Implementation agent → code only after failing tests exist
Once the tests are approved and demonstrably failing, let the implementation agent write code until the suite passes. GitHub’s Copilot CLI docs explicitly recommend this TDD-style sequence: write failing tests, review them, then implement to make them pass.

Hardening agent → generate stronger tests
After the first pass, add a hardening phase:

Property-based tests for invariants and weird edge cases. Hypothesis is built for this and is valuable because it explores input ranges and surfaces edge cases humans often miss.

Contract tests for APIs and service boundaries. Pact exists specifically to verify that HTTP/message integrations conform to a shared contract, avoiding brittle end-to-end-only approaches.

Mutation testing to check whether your tests actually detect defects. Stryker’s core idea is simple: mutate the code and rerun tests; if the tests still pass, they are weaker than they look.

Eval the agents themselves
Don’t only test your app — test your test-generation workflow. OpenAI’s current eval guidance is to score systems on measurable checks and use eval-driven development early and often; their newer Codex eval post frames this as outcome, process, style, and efficiency checks over captured runs. Anthropic similarly recommends programmatic eval loops and tracking runtime, tool calls, and errors. Put these evals in CI so regressions in your agent prompts or tools get caught before they affect the repo.

The biggest practical lesson from recent benchmarking is this: “tests passed” is not enough. A 2025 SWE-Bench analysis found many cases where generated patches were labeled as passing even though they were still wrong, partly because of insufficient tests and parser/evaluation issues. That is a strong argument for adding mutation testing, stronger generated test augmentation, and independent review instead of trusting the first green run.

A good minimal stack for you would be:

Agent 1: Spec-to-test-plan

Agent 2: Unit/integration test writer

Agent 3: Test critic

Agent 4: Implementer

Agent 5: Hardener (property/contract/mutation)

CI evaluator for the agents and the codebase