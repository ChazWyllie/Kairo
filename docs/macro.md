I’m putting this together as a production-grade agent system rather than just a few prompts. I’m checking current USDA API details and current agent-design guidance so the spec reflects what actually works now, then I’ll give you the architecture, prompt pack, guardrails, workflows, and failure handling.

I have the current USDA/API pieces and the agent-design guidance I need. The main design decision is clear now: make the macro math deterministic in code, and use AI for orchestration, clarification, policy selection, USDA matching, and explanation—not for the final calorie/macro arithmetic itself.

Thought for 2m 48s

Yes. The best version of this system is not “one super-agent with a long prompt.” It is a controlled agentic workflow wrapped around a deterministic macro engine and a USDA-backed nutrition data layer. That design matches current agent best practices: structured prompts with clear sections, narrow tools with clean boundaries, compact tool responses, durable stateful workflows, human checkpoints where needed, and an eval loop that hardens prompts over time. USDA FoodData Central is a strong fit here because it offers REST access, requires a data.gov API key, has a default limit of 1,000 requests/hour/IP, and its data is public domain under CC0; USDA also provides downloadable JSON/CSV datasets you can ingest locally.

The core design decision

Use AI for:

intake parsing

ambiguity detection

policy selection

USDA food search/ranking

explanation generation

coding, testing, and review workflows

Do not use AI for:

final calorie arithmetic

macro arithmetic

unit conversions

policy constants

safety gating

Those should be deterministic code paths. Also, if you build on OpenAI, target the Responses API rather than Assistants for new work; OpenAI says Assistants is deprecated and will shut down on August 26, 2026, and the Responses API has cleaner semantics plus improved tool usage for reasoning models. For structured agent outputs, use strict JSON schemas; OpenAI’s Structured Outputs are designed to reliably adhere to developer-supplied schemas, and OpenAI specifically notes you should disable parallel tool calls for schema-critical flows.

What the full system should look like
1) Runtime architecture

You want six layers:

Client intake layer
Collects height, weight, age, sex, goal, training frequency, step count, optional body-fat estimate, dietary preferences, food dislikes, allergies, check-in history, and unit system.

Normalization layer
Converts units, validates ranges, flags contradictions, fills defaults, and produces a canonical ClientProfile.

Macro policy engine
Deterministic code. Computes calories and macros from a configurable ruleset. This is your coaching IP.

USDA nutrition layer
Searches foods, resolves ambiguities, canonicalizes nutrient data, and stores normalized food records.

Recommendation layer
Builds meal suggestions, substitutions, grocery suggestions, and example daily plans based on macro targets plus USDA foods.

Agent orchestration layer
Plans work, calls tools, reviews changes, generates explanations, and runs evals.

The USDA layer should not be responsible for “what the client should eat.” It should be responsible for “what this food contains.” Your engine decides targets; USDA informs food composition. USDA’s API is centered on Food Search and Food Details, and the downloadable datasets let you build a local low-latency mirror for production.

2) Agent topology

Do not start with five autonomous agents chatting forever. Start with a graph/state machine:

Planner

Implementer

Reviewer

Evaluator

USDA data specialist as a tool-using sub-role, not a free-standing autonomous worker

That aligns with modern guidance: durable execution, state inspection, human-in-the-loop, and clear memory boundaries outperform loose autonomous loops in production. Anthropic also recommends prompt sectioning and strong tool contracts, and LangGraph explicitly positions graph workflows around durable execution, human oversight, memory, and debugging visibility.

3) Repo shape

Use a repo like this:

kairo-macro-engine/
  docs/
    architecture.md
    decisions/
      ADR-001-deterministic-macro-core.md
      ADR-002-usda-ingestion-strategy.md
      ADR-003-agent-workflow.md
    policies/
      macro-policy.md
      adjustment-policy.md
      nutrition-safety-policy.md
  prompts/
    system/
      orchestrator.md
    roles/
      planner.md
      implementer.md
      reviewer.md
      evaluator.md
      usda_specialist.md
    tasks/
      feature_template.md
      bugfix_template.md
      refactor_template.md
  schemas/
    client_profile.schema.json
    macro_policy.schema.json
    macro_targets.schema.json
    usda_food_candidate.schema.json
    canonical_food.schema.json
    checkin_event.schema.json
    adjustment_decision.schema.json
    agent_plan.schema.json
    code_review.schema.json
  services/
    intake/
    macro_engine/
    usda/
    recommendations/
    adjustments/
    audit/
  tests/
    unit/
    integration/
    golden/
    evals/
  data/
    usda/
      raw/
      normalized/
4) Canonical objects you need

Your system should be schema-first.

ClientProfile
{
  "client_id": "string",
  "sex": "male|female|other|unknown",
  "age_years": 24,
  "height_cm": 178,
  "weight_kg": 82.0,
  "body_fat_pct": 16.5,
  "goal": "fat_loss|maintenance|muscle_gain|recomp",
  "activity": {
    "steps_per_day": 8500,
    "resistance_sessions_per_week": 4,
    "cardio_sessions_per_week": 3,
    "occupation_activity": "sedentary|light|moderate|high"
  },
  "diet": {
    "preferences": ["high_protein"],
    "restrictions": [],
    "allergies": []
  },
  "locale": "en-US",
  "units_original": "imperial|metric"
}
MacroTargets
{
  "client_id": "string",
  "calories_kcal": 2450,
  "protein_g": 190,
  "carbs_g": 250,
  "fat_g": 70,
  "fiber_g": 30,
  "water_ml": 3000,
  "policy_version": "2026-03-08-v1",
  "explanation": {
    "goal_strategy": "string",
    "assumptions": ["string"],
    "adjustment_notes": ["string"]
  }
}
CanonicalFood
{
  "food_id": "usda:123456",
  "display_name": "Chicken breast, roasted",
  "source": "USDA",
  "fdc_id": 123456,
  "data_type": "Foundation|Branded|FNDDS|SR Legacy|Experimental",
  "serving_reference": {
    "grams": 100,
    "label": "100 g"
  },
  "nutrients_per_100g": {
    "calories_kcal": 165,
    "protein_g": 31.0,
    "carbs_g": 0.0,
    "fat_g": 3.6,
    "fiber_g": 0.0
  },
  "confidence": {
    "match_score": 0.96,
    "ambiguity_flags": []
  },
  "raw_usda_snapshot": {}
}
5) Macro engine rules you should own

Your engine should be policy-driven, not hardcoded into prompts.

Create a MacroPolicy file with:

allowed goal modes

calorie adjustment bands

protein floor strategy

fat floor strategy

carbohydrate remainder strategy

fallback logic when body-fat is missing

adherence adjustment thresholds

check-in cadence

minimum data required for automated weekly adjustments

escalation rules for human review

The agent can read policy. It cannot silently rewrite policy.

A good internal rule is:

policy changes require explicit approval

formula changes require ADR + tests

macro outputs must include assumptions

every output must be reproducible from stored inputs + policy version

6) USDA integration strategy

USDA should be used in two modes:

Mode A: local-first

Ingest USDA downloadable datasets into your own store for speed, ranking, and analytics. USDA provides JSON and CSV downloads, so you can precompute normalized nutrients and search indexes.

Mode B: API fallback / refresh

Use USDA Food Search for discovery and Food Details for a selected item. USDA’s API is public, requires a key, and supports these two core endpoints. Protect your key and keep it off the client; USDA warns that exposed keys may be deactivated.

Ranking logic for USDA matches

When users type:

“chicken breast”

“lean ground beef”

“greek yogurt”

“rice cooked”

your ranking should prefer:

exact lexical match

matching preparation state

matching branded/generic intent

higher data-quality source priority

matching serving relevance

fewer ambiguity flags

Add explicit ambiguity flags for:

raw vs cooked

dry vs cooked grains

drained vs undrained canned foods

brand-specific items

serving-size mismatch

per-serving vs per-100g differences

7) Tool design for the agent

Keep tools narrow and namespaced. That is directly aligned with current tool-use guidance: pick only the right tools, namespace them clearly, and return compact, meaningful context.

Use tools like:

profile.normalize
macro.calculate_targets
macro.explain_targets
macro.adjust_from_checkins
usda.search_foods
usda.get_food_details
food.canonicalize
food.rank_candidates
repo.read_file
repo.write_patch
tests.run
evals.run
audit.record_decision

Each tool should:

accept strict schema input

return strict schema output

be idempotent where possible

avoid bloated responses

include warnings and confidence

8) The prompt system

This is the part you can hand to your AI agent.

A. Root system prompt
You are the engineering orchestrator for a production macro coaching platform.

Your mission:
Build and maintain a deterministic macro engine with USDA-backed nutrition data integration.
You do not invent nutrition facts, policy constants, or arithmetic results.
You use tools and repository context to produce safe, testable, reviewable changes.

Operating rules:
1. Deterministic code owns all calorie, macro, unit-conversion, and policy computations.
2. USDA is a nutrition data source, not the source of macro-target policy.
3. Never silently change policy, formulas, thresholds, or safety behavior.
4. Every non-trivial change must include:
   - plan
   - files affected
   - tests to add or update
   - risks
   - rollback notes
5. Prefer the smallest correct change that preserves architecture.
6. If information is ambiguous, surface assumptions explicitly.
7. Return outputs in the required schema only.
8. Use one schema-critical tool call at a time.
9. Never expose secrets or embed API keys in code, logs, tests, or docs.
10. If a request affects health-sensitive behavior, route it through policy review.

Prompt structure you must follow:
<background_information>
<current_task>
<constraints>
<tool_guidance>
<output_contract>

You must reason through the task by:
- planning
- executing with tools
- reviewing
- proposing validations
Do not skip validation.

This prompt style follows current context-engineering guidance: use explicit sections and clear boundaries.

B. Planner prompt
You are the planner.

Goal:
Produce an implementation plan for the requested macro-engine or USDA-related change.

Requirements:
- Read existing architecture and relevant policies first.
- Do not propose policy changes unless requested.
- Distinguish between deterministic engine work, USDA data work, and agent scaffolding work.
- Prefer a graph workflow over open-ended autonomous loops.
- Include acceptance criteria and test strategy.

Return JSON:
{
  "summary": "string",
  "scope": {
    "in_scope": ["string"],
    "out_of_scope": ["string"]
  },
  "assumptions": ["string"],
  "files_to_create": ["string"],
  "files_to_edit": ["string"],
  "tests_to_add": ["string"],
  "risks": ["string"],
  "acceptance_criteria": ["string"],
  "needs_human_review": false
}
C. Implementer prompt
You are the implementer.

Goal:
Make the smallest correct change that satisfies the planner output.

Requirements:
- Preserve deterministic ownership of all arithmetic.
- Prefer pure functions for macro calculations.
- Keep USDA integration behind adapters.
- Add or update tests before claiming completion.
- If a schema exists, conform to it rather than inventing fields.
- If an assumption is required, document it in code comments or ADR notes where appropriate.

Return JSON:
{
  "change_summary": "string",
  "files_changed": ["string"],
  "tests_added_or_updated": ["string"],
  "migration_notes": ["string"],
  "follow_up_risks": ["string"]
}
D. USDA specialist prompt
You are the USDA nutrition data specialist.

Goal:
Design and maintain robust USDA ingestion, search, matching, normalization, and food-detail retrieval.

Rules:
- Use USDA as the source of food composition data.
- Preserve source provenance, FDC IDs, data type, and retrieval timestamp.
- Normalize nutrients to per-100g and preserve serving metadata separately.
- Detect and surface ambiguities instead of guessing.
- Distinguish generic foods from branded foods.
- Prefer exact preparation-state matches.

Return JSON:
{
  "candidate_strategy": ["string"],
  "normalization_rules": ["string"],
  "ambiguity_flags": ["string"],
  "ranking_features": ["string"],
  "edge_cases": ["string"]
}
E. Reviewer prompt
You are the reviewer.

Goal:
Critically review the implementation for correctness, architecture fit, policy compliance, and test quality.

Review for:
- deterministic arithmetic ownership
- USDA adapter boundaries
- prompt/schema compliance
- hidden policy changes
- missing tests
- ambiguous or unsafe behavior
- logging of sensitive data
- edge-case failures

Return JSON:
{
  "approved": false,
  "blocking_issues": ["string"],
  "non_blocking_issues": ["string"],
  "missing_tests": ["string"],
  "architecture_concerns": ["string"],
  "recommended_fixes": ["string"]
}
F. Evaluator prompt
You are the evaluator.

Goal:
Turn failures into permanent regression tests.

Rules:
- When a bug is found, create a minimal reproducible test case.
- Label failures by category:
  "unit_conversion", "policy_regression", "food_match_error",
  "macro_math_error", "ambiguity_handling", "schema_violation",
  "tool_misuse", "prompt_regression"
- Propose one golden test and one fuzz test when possible.

Return JSON:
{
  "failure_category": "string",
  "minimal_repro": "string",
  "golden_test": "string",
  "fuzz_test": "string",
  "expected_behavior": "string"
}
9) The task template you should feed the agent

Use a single reusable task template:

<background_information>
Repository: kairo-macro-engine
Architecture docs:
- docs/architecture.md
- docs/policies/macro-policy.md
- docs/policies/adjustment-policy.md
Relevant schemas:
- schemas/client_profile.schema.json
- schemas/macro_targets.schema.json
- schemas/canonical_food.schema.json
</background_information>

<current_task>
[Describe the feature or bug precisely]
</current_task>

<constraints>
- Deterministic code owns all calorie/macro arithmetic.
- USDA owns food composition, not coaching policy.
- No secret leakage.
- No silent policy changes.
- All changes require tests.
- Keep changes minimal and production-ready.
</constraints>

<tool_guidance>
1. Read architecture and policies first.
2. Produce a plan.
3. Make changes.
4. Run tests.
5. Run review.
6. Return final structured report.
</tool_guidance>

<output_contract>
Return JSON matching schemas/agent_plan.schema.json
</output_contract>
10) Modern ideas worth adopting immediately

These are the ones actually worth the complexity:

Structured outputs everywhere

Use strict schemas for plans, reviews, USDA normalization, and final reports. OpenAI’s Structured Outputs are specifically built for schema adherence; for schema-critical flows, avoid parallel tool calls.

Context sectioning

Keep prompts segmented into background, instructions, tools, and output contract. Anthropic explicitly recommends this style.

Prompt caching

Cache stable system prompts, tool definitions, and long static docs where your provider supports it. Anthropic’s prompt-caching docs explicitly call out tools, system blocks, messages, and tool results as cacheable.

Eval flywheel

Treat prompt quality as an engineering loop, not a one-time draft. OpenAI’s cookbook recommends a continuous evaluation flywheel for prompt resilience.

Narrow tool responses

Return only what the next step needs. This reduces context waste and lowers error rates.

Human approval gates

Require approval for:

policy edits

formula changes

adjustment-threshold edits

sensitive-client handling logic

migrations affecting historical outputs

Shadow mode

Before letting the system auto-adjust client macros, run it in shadow mode for 2–4 weeks:

compute suggestions

log what it would have changed

compare against human coaching decisions

11) The gaps most builders miss

Make sure your system handles:

metric vs imperial normalization

contradictory inputs

missing body-fat data

unrealistic activity claims

raw vs cooked USDA entries

branded vs generic foods

dry rice vs cooked rice

drained canned foods

food search ambiguity

macro rounding strategy

adherence not matching predicted maintenance

weekly weight noise

non-scale-velocity inputs

manual overrides with audit trail

policy versioning

historical reproducibility

regression tests for every bug class

secure API key handling

local USDA cache invalidation

low-latency fallback when USDA API is unavailable

USDA’s API key guidance and rate limits make secret handling and caching non-optional in production.

12) First implementation order

Build in this order:

ClientProfile schema + normalization

deterministic macro engine

macro explanation layer

USDA search adapter

USDA details adapter

food canonicalization

local USDA cache/index

meal suggestion layer

weekly adjustment engine

agent planner/implementer/reviewer prompts

eval harness

audit dashboard

13) My strongest recommendation

For your project, the best agent prompt strategy is:

one root orchestrator

a graph workflow

schema-first outputs

deterministic nutrition logic

USDA behind a dedicated adapter

eval-driven prompt iteration

approval gates for policy changes

That gives you something an AI agent can actually build and maintain without quietly drifting into bad architecture.