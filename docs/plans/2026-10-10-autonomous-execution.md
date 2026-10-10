# Autonomous Sequential Execution — Implementation Plan

<!-- EXECUTION CONTRACT — read before touching any task -->
> When the user asks for a specific task (e.g. "do TASK-03"):
> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets, and do not write a changelog entry.
> 6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.

**Goal:** Change the kit's default from "stop after every task" to "run every task in order, commit after each, stop only on S1–S4", and harden plan-writing rules for fast executor models — v0.7.0.

**Architecture:** The kit is four Markdown skills plus an installer. The new execution contract is one fixed text block that appears verbatim in two skills (`plan-universal` plan header and `handoff-plan` message template); everything else (changelog skill, instructions block, README) references it and must agree with it. No installer code changes.

**Tech / dependencies:** Markdown only; Node ≥18 for the installer smoke test (`bin/cli.js`).

**Spec:** `docs/specs/2026-10-10-autonomous-execution-design.md`

**File map:**
- `skills/plan-universal/SKILL.md` — plan header (new contract), plan-writing rules, self-review, closing message
- `skills/handoff-plan/SKILL.md` — handoff message template (contract on top), rules, length limit
- `skills/changelog/SKILL.md` — reference to the contract step that invokes it
- `templates/instructions-block.md` — summary sentence written into CLAUDE.md / AGENTS.md on install
- `README.md` — Workflow and "What's in a plan" sections
- `package.json` — version bump

---

### TASK-01: New contract and plan-writing rules in plan-universal

**Targets:**
- `skills/plan-universal/SKILL.md` (modify)

**Implementation Notes:**
- Replace the contract lines inside the "Plan document structure" header block (currently `skills/plan-universal/SKILL.md:35-42`, from `<!-- EXECUTION CONTRACT` through rule 6) with exactly this text. Keep it inside the existing ````markdown fence; leave `# <Feature Name>`, Goal, Architecture, Tech, File map lines as they are:

  ```markdown
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
  ```

- Line 86 ("Tasks are self-contained because the executor reads exactly one block per turn…"): change "per turn" to "at a time" — the executor now runs tasks back to back but still reads one block at a time.
- "No placeholders" list: add a bullet — `References you haven't verified — every file, function, command, flag, and config key in Implementation Notes either exists in the repo (open it and check while writing the plan) or is created by an earlier task's Targets. If you can't confirm it, don't write it.`
- "Self-review" list: extend item 5 "Verification reality" with: `Every Verification command terminates on its own — no watch mode, no dev server left running; the executor runs tasks back to back and a hung command blocks the whole run.` Add item 6: `**Order** — each task may assume only that earlier tasks are done. The executor runs them top to bottom.` Add item 7: `**References exist** — every path, function, and command named in a task exists in the repo or is created by an earlier task.`
- "After the plan" section: replace the quoted message with:
  `> Plan saved to `<path>` and committed. To execute every task in order, say "run the plan" — I'll commit after each task and stop only on a stop condition (S1–S4). To run a single task, say "do TASK-01". To hand it to another LLM agent, run `/handoff-plan`.`
  Replace the last line with: `Do not start implementing in the same turn. Wait for the user to say how to run it.`

**Done When:**
- The header block in the skill contains the contract text above verbatim, and no line containing "Wait for approval before moving to the next task" remains in the file
- The three self-review additions and the new "No placeholders" bullet are present
- The "After the plan" message mentions "run the plan", "do TASK-01", and `/handoff-plan`

**Verification:**
- Manual: `git grep -n "S4: The working tree was not clean" -- skills/plan-universal/SKILL.md` → 1 hit
- Manual: `git grep -n "Wait for approval before moving" -- skills/plan-universal/SKILL.md` → no output
- Manual: `git grep -n -e "References exist" -e "terminates on its own" -e "run the plan" -- skills/plan-universal/SKILL.md` → 3 hits

---

### TASK-02: Contract-first handoff message

**Targets:**
- `skills/handoff-plan/SKILL.md` (modify)

**Implementation Notes:**
- The contract text is the block between `<!-- EXECUTION CONTRACT` and `After the last task: report the list of commits made.` in `skills/plan-universal/SKILL.md` (written by TASK-01, inside the "Plan document structure" section). Copy it character for character — do not rephrase.
- Replace the "Message template" fenced block (currently `skills/handoff-plan/SKILL.md:45-71`) with:

  ````text
  You're executing an approved implementation plan in this repo.

  <contract block from skills/plan-universal/SKILL.md, verbatim>

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

  In the skill file, write the actual contract lines in place of the `<contract block …>` placeholder line — the template must contain the real text.
- Removed on purpose: the old "How to execute" 6-rule list and the line "Start by reading `<plan path>` end-to-end, then wait for me…" (it contradicted the read-one-block rule).
- "Rules" section changes:
  - `Don't reformat the execution contract beyond the 6 numbered rules above…` → `Don't reformat the execution contract. It is copied verbatim from the plan-universal header; the plan file is the source of truth.`
  - `Keep the message under ~50 lines…` → `Keep the message under ~60 lines, not counting the task list. If you're tempted to add more context, you're inlining the plan — stop.`
- Frontmatter `description` and intro: "so it can pick up execution" stays; no change needed.

**Done When:**
- The template's first line is "You're executing an approved implementation plan in this repo." followed by the full contract text
- The template ends with the "Start now: …" line; no "end-to-end" or "wait for me to ask" text remains
- The contract text in this file is identical to the one in `skills/plan-universal/SKILL.md`

**Verification:**
- Manual: `git grep -n -e "end-to-end" -e "wait for me to ask" -- skills/handoff-plan/SKILL.md` → no output
- Manual: `git grep -c "S4: The working tree was not clean" -- skills/` → `skills/handoff-plan/SKILL.md:1` and `skills/plan-universal/SKILL.md:1`
- Manual: extract both blocks and compare — `node -e "const f=p=>{const s=require('fs').readFileSync(p,'utf8');const a=s.indexOf('<!-- EXECUTION CONTRACT');const b=s.indexOf('report the list of commits made.',a);return s.slice(a,b)};console.log(f('skills/plan-universal/SKILL.md')===f('skills/handoff-plan/SKILL.md')?'IDENTICAL':'DIFFERENT')"` → `IDENTICAL` (if it prints DIFFERENT only because of leading indentation, fix the indentation in this file)

---

### TASK-03: Align changelog skill and instructions block

**Targets:**
- `skills/changelog/SKILL.md` (modify)
- `templates/instructions-block.md` (modify)

**Implementation Notes:**
- `skills/changelog/SKILL.md:14`: "Rule 6 of the plan's execution contract sends you here…" → "Step 5 of the plan's execution contract sends you here…". Rest of the sentence unchanged.
- Keep the "## Do not commit" section as is — the contract commits right after the entry, so the entry and the change still land in the same commit. Append one sentence to that section: `In a plan run, the execution contract commits the task's changes and this entry together right after you finish.`
- `templates/instructions-block.md:11`: replace the "Plans contain an execution contract…" paragraph with:
  `Plans contain an execution contract at the top. By default, run every task in order: after each task passes its Verification, write the changelog entry and commit; stop only on a stop condition (S1–S4). "do TASK-03" runs only that task.`
  Keep the `<!-- tuncss-plan-kit:start -->` / `:end -->` markers and the command list untouched — `bin/cli.js:215` replaces the block between the markers.

**Done When:**
- No "Rule 6" text remains in `skills/changelog/SKILL.md`
- The instructions block describes the run-all default and still has both markers

**Verification:**
- Manual: `git grep -n "Rule 6" -- skills/changelog/SKILL.md` → no output
- Manual: `git grep -n -e "tuncss-plan-kit:start" -e "tuncss-plan-kit:end" -e "run every task in order" -- templates/instructions-block.md` → 3 hits

---

### TASK-04: README and v0.7.0

**Targets:**
- `README.md` (modify)
- `package.json` (modify)

**Implementation Notes:**
- `README.md` "Workflow" block (lines 65-88): replace the `You: do TASK-01` step with:
  ```
  You:     run the plan
  Agent:   runs every task in order; after each one it writes the changelog
           entry to docs/CHANGELOG.md and commits; stops only on a stop
           condition (S1–S4) and reports where and why
  ```
  Keep the "— or —" `/handoff-plan` part; change its description to "writes a briefing to docs/handoffs/ — the execution contract on top — that you can paste into another agent".
- `README.md` "What's in a plan" (lines 90-101): replace the quoted 6 rules with the full contract text copied verbatim from `skills/plan-universal/SKILL.md` (block from `<!-- EXECUTION CONTRACT` to `report the list of commits made.`; drop the `<!-- … -->` comment line in the README). Below it add one sentence: `Commit messages are Turkish, ASCII only — the kit's team writes them that way.` Keep the existing closing sentence about contracts and pointers.
- `package.json`: `"version": "0.6.0"` → `"version": "0.7.0"`.

**Done When:**
- README Workflow shows "run the plan"; "What's in a plan" shows the S1–S4 contract
- `package.json` version is `0.7.0`
- The installer still installs: a fresh project gets the new contract in its skill files

**Verification:**
- Manual: `git grep -n -e "run the plan" -e "S4: The working tree was not clean" -- README.md` → at least 2 hits
- Manual: `node -p "require('./package.json').version"` → `0.7.0`
- Manual (installer smoke test, run from the repo root in PowerShell):
  `$repo = (Get-Location).Path; $d = Join-Path $env:TEMP "plankit-smoke-$(Get-Random)"; New-Item -ItemType Directory $d | Out-Null; Push-Location $d; node "$repo\bin\cli.js" init --target=claude; Pop-Location; Select-String -Path "$d\.claude\skills\plan-universal\SKILL.md" -Pattern "S4: The working tree"`
  → installer exits without error and `Select-String` prints one match.
