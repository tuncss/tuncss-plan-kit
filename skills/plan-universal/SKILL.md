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
> **Default: run every task in order, from TASK-01 to the last, without stopping between tasks.**
> If the user names a single task ("do TASK-03"), do only that task, then stop.
> If the user names a starting task ("run from TASK-04"), start there and continue in order.
> This plan is already approved. Do not write your own plan or task list — execute this one.
>
> **Before the first task:** run `git status`. If the working tree is not clean, stop (S4).
>
> **For each task:**
> 1. Read only that task's block. Do not preview later tasks.
> 2. Edit only the files in its **Targets**.
> 3. Follow its **Implementation Notes**; add no extra scope.
> 4. Run its **Verification**. If it fails, make one fix attempt inside Targets and run it again.
> 5. When **Done When** and **Verification** pass: append the changelog entry with the `changelog`
>    skill (from the actual diff), then commit the task's changes and the entry together.
> 6. **Commit message:** Turkish, ASCII only — write c, s, i, g, o, u instead of ç, ş, ı, ğ, ö, ü.
>    First line `TASK-NN: <what changed>`, under 72 characters. Say what changed, not "dosyalar guncellendi".
>    Example: `TASK-03: Oturum suresi 24 saatten 2 saate dusuruldu`
>
> **Stop and report when:**
> - S1: Verification fails a second time.
> - S2: A file, function, API, flag, or command the task names does not exist or differs from the description. Do not guess.
> - S3: Finishing the task requires editing a file outside its Targets.
> - S4: The working tree was not clean before the first task.
>
> On stop: no changelog entry and no commit for that task; earlier commits stay. Report the task id, the condition (S1–S4), and what you saw.
> After the last task: report the list of commits made.

**Goal:** <one sentence>

**Architecture:** <2-3 sentences on the approach>

**Tech / dependencies:** <key libraries, runtimes, services>

**File map:**
- `path/to/a.ts` — <responsibility>
- `path/to/b.ts` — <responsibility>
- `tests/...` — <what's covered, if anything>

---
````

## Task structure

Every task uses this shape:

````markdown
### TASK-01: <short name>

**Targets:**
- `exact/path/to/file.ts` (create | modify | delete)
- `exact/path/to/other.ts` (modify)

**Implementation Notes:**
- What this task does, in plain language
- Any non-obvious decision and why
- The contract the executor can't guess: types, function signatures, commands, config keys. Write code bodies only for logic that is genuinely non-obvious (an algorithm, a regex, a query, a tricky edge case) — the executor writes the rest
- Point to existing code instead of copying it: "follow the handler pattern in `src/routes/users.ts:40`"
- If a public interface from an earlier task is consumed here, restate its signature only; don't make the reader page back

**Done When:**
- Bullet list of observable outcomes
- E.g. "endpoint returns 200 with `{ id, status }` body for valid input"
- E.g. "type `Foo` exported from `src/foo.ts`"

**Verification:**
- Manual: <commands the engineer runs and what they should see>
- Automated (optional): <test files, scripts, or `npm test -- foo` commands and expected output, only if automated coverage genuinely belongs here>
````

Tasks are self-contained because the executor reads exactly one block at a time (see the Execution Contract). If TASK-07 needs the shape of something defined in TASK-02, restate it in TASK-07 — don't make the reader scroll.

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
- Steps that describe *what* without pointing to *how* — name the existing file to follow, the signature, or the exact command; don't paste whole function bodies the executor can write itself
- References to types, functions, or files not defined in any task or in the file map
- References you haven't verified — every file, function, command, flag, and config key in Implementation Notes either exists in the repo (open it and check while writing the plan) or is created by an earlier task's Targets. If you can't confirm it, don't write it.

## Self-review

After the plan is written, re-read it against the spec with fresh eyes. Fix issues inline; no second review pass.

1. **Spec coverage** — go through each requirement in the spec. Can you point to the task that implements it? Add tasks for any gap.
2. **Placeholder scan** — anything from the "No placeholders" list? Fix.
3. **Name and type consistency** — a function called `clearLayers()` in TASK-03 but `clearFullLayers()` in TASK-07 is a bug. Same for types, file paths, env vars, table names.
4. **Targets isolation** — does any task's Targets list overlap awkwardly with another in a way that will force out-of-order edits? If so, resequence or merge.
5. **Verification reality** — every Done When has a corresponding Verification step that an engineer can actually run. Every Verification command terminates on its own — no watch mode, no dev server left running; the executor runs tasks back to back and a hung command blocks the whole run.
6. **Order** — each task may assume only that earlier tasks are done. The executor runs them top to bottom.
7. **References exist** — every path, function, and command named in a task exists in the repo or is created by an earlier task.

## After the plan

Save the plan, commit it, and tell the user:

> Plan saved to `<path>` and committed. To execute every task in order, say "run the plan" — I'll commit after each task and stop only on a stop condition (S1–S4). To run a single task, say "do TASK-01". To hand it to another LLM agent, run `/handoff-plan`.

Do not start implementing in the same turn. Wait for the user to say how to run it.
