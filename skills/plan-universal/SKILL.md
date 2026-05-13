---
name: plan-universal
description: Use when you have an approved spec or a clear multi-step task and need to write the implementation plan before any code is written. Invoked via /plan-universal, usually after the brainstorm skill.
---

# Writing Plans

Turn a spec into a plan an engineer can execute task by task without re-reading the spec. Assume they're capable but have zero context on this codebase or problem domain — every task must stand on its own.

**Announce at start:** "Writing the implementation plan."

**Save plans to:** `docs/plans/YYYY-MM-DD-<feature-name>.md` (override if the user has set a different location). Create `docs/plans/` if it doesn't exist.

## Scope check

If the spec covers multiple independent subsystems, that should have been caught during brainstorming. If it slipped through, stop and propose splitting it into one plan per subsystem before writing tasks. Each plan should produce working, testable software on its own.

## File structure first

Before defining tasks, map every file the plan will create or modify and what each is responsible for. Decomposition decisions get locked in here, not inside individual tasks.

- One clear responsibility per file. Files that change together live together; split by responsibility, not technical layer.
- Smaller, focused files are easier to edit reliably than large ones doing many things.
- In an existing codebase, follow the patterns already there. If a file you're modifying has grown unwieldy and the work touches it heavily, including a focused split in the plan is reasonable. Don't bundle unrelated restructuring.

This map is what makes the task list coherent. Each task should produce changes that make sense as a self-contained unit.

## Plan document structure

Every plan starts with this header:

````markdown
# <Feature Name> — Implementation Plan

<!-- EXECUTION CONTRACT — read before touching any task -->
> When the user asks for a specific task (e.g. "do TASK-03"):
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets.

**Goal:** <one sentence>

**Architecture:** <2-3 sentences on the approach>

**Tech / dependencies:** <key libraries, runtimes, services>

**File map:**
- `path/to/a.ts` — <responsibility>
- `path/to/b.ts` — <responsibility>
- `tests/...` — <what's covered, if anything>

---
````

## Model tiers

Every task gets a recommended tier. These are the cost/capability brackets for the model that should execute it:

- **T1 — Fast:** trivial edits, renames, formatting, single-file boilerplate
- **T2 — Balanced:** standard feature work in one component, contained logic
- **T3 — Power:** multi-file changes, non-trivial logic, refactors with consequence
- **T4 — Reasoning:** architecture decisions, gnarly debugging, cross-cutting design

When in doubt, pick the lower tier. Upgrades are cheap; over-spending isn't.

## Task structure

Every task uses this shape:

````markdown
### TASK-01: <short name>

**Targets:**
- `exact/path/to/file.ts` (create | modify | delete)
- `exact/path/to/other.ts` (modify)

**Model Tier:** T2  <!-- T1 Fast | T2 Balanced | T3 Power | T4 Reasoning -->

**Implementation Notes:**
- What this task does, in plain language
- Any non-obvious decision and why
- Concrete code, types, function signatures, or commands the engineer needs — not "implement the handler" but the actual handler shape
- If a public interface from an earlier task is consumed here, restate its signature; don't make the reader page back

**Done When:**
- Bullet list of observable outcomes
- E.g. "endpoint returns 200 with `{ id, status }` body for valid input"
- E.g. "type `Foo` exported from `src/foo.ts`"

**Verification:**
- Manual: <commands the engineer runs and what they should see>
- Automated (optional): <test files, scripts, or `npm test -- foo` commands and expected output, only if automated coverage genuinely belongs here>
````

Tasks are self-contained because the executor reads exactly one block per turn (see the Execution Contract). If TASK-07 needs the shape of something defined in TASK-02, restate it in TASK-07 — don't make the reader scroll.

## Granularity

Each task should be a self-contained slice that produces something testable. Not microsteps like "write the failing test" / "make it pass" — that's noise. A task is roughly: a feature surface, a module, an endpoint, a screen, a migration. Split when:
- Targets cross unrelated areas
- The verification step would need multiple unrelated checks
- The Implementation Notes start branching ("either X or Y depending on…")

Merge when a task is so small it has no meaningful Done When of its own.

## Tests are not mandatory

Don't dictate TDD or per-task test coverage. Add Automated Verification only when an automated check genuinely belongs in that task (a regression test for a known-bug fix, a contract test for a new public API). For most tasks, **Done When** + Manual Verification is enough. Let the executor judge whether more coverage pays for itself.

## No placeholders

These are **plan failures**. Never write them:
- "TBD", "TODO", "implement later", "fill in details"
- "Add appropriate error handling" / "validate input" / "handle edge cases" — name the cases
- "Write tests for the above" without the actual test names and what they assert
- "Similar to TASK-N" — repeat what's needed; the executor reads tasks out of order
- Steps that describe *what* without showing *how* — if a task changes code, show the code shape, the type, or the exact command
- References to types, functions, or files not defined in any task or in the file map

## Self-review

After the plan is written, re-read it against the spec with fresh eyes. Fix issues inline; no second review pass.

1. **Spec coverage** — go through each requirement in the spec. Can you point to the task that implements it? Add tasks for any gap.
2. **Placeholder scan** — anything from the "No placeholders" list? Fix.
3. **Name and type consistency** — a function called `clearLayers()` in TASK-03 but `clearFullLayers()` in TASK-07 is a bug. Same for types, file paths, env vars, table names.
4. **Targets isolation** — does any task's Targets list overlap awkwardly with another in a way that will force out-of-order edits? If so, resequence or merge.
5. **Verification reality** — every Done When has a corresponding Verification step that an engineer can actually run.

## After the plan

Save the plan, commit it, and tell the user:

> Plan saved to `<path>` and committed. To execute, ask for tasks one at a time (e.g. "do TASK-01") — I'll stay inside that task's Targets and stop for approval before moving on, per the execution contract at the top of the plan. Or, if you want to hand this off to another LLM agent, run `/handoff-plan`.

Do not start implementing in the same turn. Wait for the user to request the first task.
