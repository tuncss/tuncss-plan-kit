---
name: handoff-plan
description: Use after writing a plan when the user wants a short briefing message to paste into another LLM agent (Codex, Cursor, Copilot, etc.) so it can pick up execution. Triggered by /handoff-plan.
---

# Handoff Plan

Produce a short, paste-ready briefing message that another LLM agent can use to pick up an existing plan in this repo. The receiving agent is assumed to have filesystem access — the message points at files rather than inlining them.

**Announce at start:** "Generating handoff message."

## Inputs

- **If the user passes a plan path** (e.g. `/handoff-plan docs/plans/2026-05-13-foo.md`), use that file.
- **Otherwise** pick the most recently modified `*.md` in `docs/plans/`. If `docs/plans/` doesn't exist or is empty, stop and tell the user to run `/plan-universal` first.

If a spec matching the plan's slug exists in `docs/specs/`, include its path too. Best-effort match by filename slug; don't fabricate a path — omit the spec line if there's no clear match.

## What to extract from the plan

Read the plan file and pull:
- **Goal** — the one-line goal from the header
- **Tech / dependencies** — the tech line from the header
- **Task list** — every `### TASK-NN: <name>` heading (just the numbers and names, not the bodies)

## Repo context

Get a one-line project descriptor:
- Prefer `package.json` `name` + `description`
- Fall back to the first non-empty line of `README.md`
- One short sentence — no marketing language

## Output

Write the message to `docs/handoffs/YYYY-MM-DD-<feature-slug>.md` (date = today, slug = same slug as the plan file). Create `docs/handoffs/` if missing.

After writing, print only a single confirmation line to chat:

> Handoff written to `docs/handoffs/<filename>.md`.

Do not echo the message contents — the user will open the file.

## Message template

````text
You're picking up an implementation plan in this repo.

**Project:** <project name> — <one-line description>

**Plan:** `<path/to/plan.md>`
**Spec:** `<path/to/spec.md>`   ← omit this line entirely if no spec found

**Goal:** <goal line from plan>

**Tech:** <tech line from plan>

**Tasks:**
- TASK-01: <name>
- TASK-02: <name>
- ...

**How to execute (full execution contract is at the top of the plan file):**
1. When I ask for a task ("do TASK-03"), read **only** that task's block in the plan.
2. Stay strictly inside its **Targets** — don't edit files outside that list.
3. Follow the **Implementation Notes**; don't invent extra scope.
4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for my approval before moving on.
5. If verification fails, report and stop. Don't attempt fixes outside the task's Targets, and don't write a changelog entry.
6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.

Start by reading `<plan path>` end-to-end, then wait for me to ask for the first task. Don't begin TASK-01 until I ask.
````

## Rules

- Don't summarize task bodies. The receiving agent reads the plan file itself.
- Don't reformat the execution contract beyond the 6 numbered rules above. They are the contract; the plan file is the source of truth.
- Keep the message under ~50 lines. If you're tempted to add more context, you're inlining the plan — stop.
- Don't include this skill's name, your model name, or any Claude-specific framing in the output. The receiver doesn't need to know how the message was generated.
