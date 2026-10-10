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
You're executing an approved implementation plan in this repo.

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

**Project:** <project name> — <one-line description>

**Plan:** `<path/to/plan.md>`
**Spec:** `<path/to/spec.md>`   ← omit this line entirely if no spec found

**Goal:** <goal line from plan>

**Tech:** <tech line from plan>

**Tasks:**
- TASK-01: <name>
- TASK-02: <name>
- ...

Start now: open `<plan path>`, read the header and TASK-01's block, and begin. Continue through every task in order until the last one is done or a stop condition (S1–S4) is hit.
````

## Rules

- Don't summarize task bodies. The receiving agent reads the plan file itself.
- Don't reformat the execution contract. It is copied verbatim from the plan-universal header; the plan file is the source of truth.
- Keep the message under ~60 lines, not counting the task list. If you're tempted to add more context, you're inlining the plan — stop.
- Don't include this skill's name, your model name, or any Claude-specific framing in the output. The receiver doesn't need to know how the message was generated.
