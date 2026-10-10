# tuncss-plan-kit

Four skills for spec-driven development, installable into Claude Code, Codex CLI, and Antigravity:

- **`/brainstorm`** — turn an idea into an approved spec (`docs/specs/`)
- **`/plan-universal`** — turn a spec into an executable plan (`docs/plans/`)
- **`/handoff-plan`** — generate a paste-ready briefing for another LLM agent to execute the plan (`docs/handoffs/`)
- **`/changelog`** — record what changed, in plain sentences (`docs/CHANGELOG.md`)

No agents, no routing, no TDD ceremony. Just four skills that get you from idea → spec → plan → handoff, and a record of what actually changed.

## Install

In your project directory:

```bash
npx tuncss-plan-kit init
```

The installer auto-detects which platform(s) the project uses and writes the right files.

| Detected | Means |
|---|---|
| `.claude/` or `CLAUDE.md` | Claude Code |
| `.codex/` | Codex CLI |
| `.agents/` | Antigravity |
| `AGENTS.md` (alone) | Codex and Antigravity (they share `AGENTS.md`) |

If nothing is detected, pass an explicit target:

```bash
npx tuncss-plan-kit init --target=claude
npx tuncss-plan-kit init --target=claude,codex
npx tuncss-plan-kit init --target=all
```

Re-running is safe. Skill and command files are overwritten only with `--force`. Instruction-file marker blocks are always replaced in place — your other content survives.

Restart your coding agent after install so it picks up the new skills and slash commands.

## What gets written where

| Platform | Skills | Commands | Instructions |
|---|---|---|---|
| Claude Code | `.claude/skills/<n>/SKILL.md` | *(none — skills auto-expose as slash)* | `CLAUDE.md` |
| Codex CLI | `.agents/skills/<n>/SKILL.md` | `.codex/prompts/<n>.md` | `AGENTS.md` |
| Antigravity | `.agents/skills/<n>/SKILL.md` | *(none — skills auto-expose as slash)* | `AGENTS.md` |

Claude Code and Antigravity automatically expose any skill named `foo` as `/foo`, so the kit doesn't write wrapper command files for them. Codex doesn't auto-expose, so wrappers are written there to give you the same `/brainstorm`, `/plan-universal`, `/handoff-plan`, `/changelog` UX everywhere.

Antigravity and Codex share `.agents/skills/`, so installing both writes those files once — the second platform reports them as already written.

Note: `agy changelog` is Antigravity's own built-in subcommand for release notes. The kit's `/changelog` is a slash command inside the agent session — same word, different place.

With `--global` the same files go to user-wide locations (`~/.claude/`, `~/.agents/`, `~/.codex/`, `~/.gemini/config/`).

**Antigravity `--global` is a plain file copy to `~/.gemini/config/`** — a single location the desktop app, the `agy` CLI, and the IDE all read, so one install covers them all. (Antigravity's docs list `~/.gemini/antigravity-cli/skills/` for the CLI, but in practice `agy` reads `~/.gemini/config/skills/` and ignores that folder, so the kit writes only the one.)

`npx tuncss-plan-kit init --global` with no `--target` looks at your home directory instead of the current one and installs for every agent it finds: `~/.claude/` → Claude Code, `~/.codex/` → Codex CLI, `~/.gemini/config/` → Antigravity.

Project-local is still the default for all three — recommended unless you specifically want the kit available everywhere.

## Workflow

```
You:     /brainstorm I want a CLI that ...
Agent:   ↓ brainstorming skill
         asks one question at a time, proposes 2-3 approaches, presents
         the design section by section, writes spec to docs/specs/
You:     (review and approve)

You:     /plan-universal
Agent:   ↓ writing-plans skill
         writes plan to docs/plans/ with execution contract at the top,
         tasks shaped as Targets / Implementation Notes /
         Done When / Verification

You:     run the plan
Agent:   runs every task in order; after each one it writes the changelog
         entry to docs/CHANGELOG.md and commits; stops only on a stop
         condition (S1–S4) and reports where and why

— or —

You:     /handoff-plan
Agent:   ↓ handoff skill
         writes a briefing to docs/handoffs/ — the execution contract on
         top — that you can paste into another agent
```

## What's in a plan

Every plan starts with this contract:

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

Commit messages are Turkish, ASCII only — the kit's team writes them that way.

Plans carry contracts (types, signatures, commands) and pointers to existing code, not pasted function bodies — the executor writes the code.

## Options

```
npx tuncss-plan-kit init [--target=<list>] [--global] [--force]
```

| Flag | Effect |
|------|--------|
| `--target=<list>` | Comma-separated. Values: `claude`, `codex`, `antigravity`, `all`. Auto-detected if omitted (from the current directory, or from your home directory with `--global`). |
| `--global` | Install to user-wide locations instead of the current project. |
| `--force` | Overwrite existing skill/command files without warning. |

## Why this exists

Existing kits ship dozens of agents and skills you'll never use, but every one of them sits in your context and burns tokens each turn. `tuncss-plan-kit` ships four files that cover the only loop most projects need: design → plan → execute (here or elsewhere) → record. That's it.

## A note on OpenCode

OpenCode was supported through v0.3.0. It was dropped in v0.4.0 because nobody
on the team uses it any more. If you need it, pin `tuncss-plan-kit@0.3.0`.

## License

MIT
