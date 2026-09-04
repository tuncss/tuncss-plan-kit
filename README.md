# tuncss-plan-kit

Four skills for spec-driven development, installable into Claude Code, Codex CLI, OpenCode, and Antigravity:

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
| `.opencode/` | OpenCode |
| `.agents/` | Antigravity |
| `AGENTS.md` (alone) | Codex, OpenCode, and Antigravity (they share `AGENTS.md`) |

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
| OpenCode | `.opencode/skills/<n>/SKILL.md` | `.opencode/commands/<n>.md` | `AGENTS.md` |
| Antigravity | `.agents/skills/<n>/SKILL.md` | *(none — skills auto-expose as slash)* | `AGENTS.md` |

Claude Code and Antigravity automatically expose any skill named `foo` as `/foo`, so the kit doesn't write wrapper command files for them. Codex and OpenCode don't auto-expose, so wrappers are written there to give you the same `/brainstorm`, `/plan-universal`, `/handoff-plan`, `/changelog` UX everywhere.

Antigravity and Codex share `.agents/skills/`, so installing both writes those files once — the second platform reports them as already written.

Note: `agy changelog` is Antigravity's own built-in subcommand for release notes. The kit's `/changelog` is a slash command inside the agent session — same word, different place.

With `--global` the same files go to user-wide locations (`~/.claude/`, `~/.agents/`, `~/.codex/`, `~/.gemini/config/`).

**OpenCode `--global` is supported via an npm-plugin route**: the kit installs itself into `~/.config/opencode/node_modules/`, registers itself in `~/.config/opencode/opencode.json`'s `plugin` array, and drops command wrappers into `~/.config/opencode/commands/`. After install, restart OpenCode — skills appear in every project. (For Claude and Codex, `--global` is a plain file copy.)

**Antigravity `--global` is a plain file copy to `~/.gemini/config/`** — a single location the desktop app, the `agy` CLI, and the IDE all read, so one install covers them all.

Project-local is still the default for all four — recommended unless you specifically want the kit available everywhere.

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
         tasks shaped as Targets / Model Tier / Implementation Notes /
         Done When / Verification

You:     do TASK-01
Agent:   reads only TASK-01's block, stays inside its Targets, writes the
         changelog entry to docs/CHANGELOG.md, stops for approval when done

— or —

You:     /handoff-plan
Agent:   ↓ handoff skill
         writes a short briefing to docs/handoffs/ that you can paste
         into another agent (or feed it the file path)
```

## What's in a plan

Every plan starts with this contract:

> 1. Read **only** that task's block. Do not preview other tasks.
> 2. Stay strictly inside its **Targets** — do not edit files outside that list.
> 3. Follow the **Implementation Notes**; do not invent extra scope.
> 4. When **Done When** and **Verification** are satisfied, write the changelog entry (rule 6), then **stop and report**. Wait for approval before moving to the next task.
> 5. If verification fails, report the failure and stop. Do not attempt fixes outside the task's Targets, and do not write a changelog entry.
> 6. **Changelog entry:** use the `changelog` skill to append this task's entry to `docs/CHANGELOG.md`. Base it on the actual diff, not on what you set out to do.

Tasks are tagged with model tiers (T1 Fast / T2 Balanced / T3 Power / T4 Reasoning) so you can route execution to the cheapest model that can do the job.

## Options

```
npx tuncss-plan-kit init [--target=<list>] [--global] [--force]
```

| Flag | Effect |
|------|--------|
| `--target=<list>` | Comma-separated. Values: `claude`, `codex`, `opencode`, `antigravity`, `all`. Auto-detected if omitted. |
| `--global` | Install to user-wide locations instead of the current project. |
| `--force` | Overwrite existing skill/command files without warning. |

## Why this exists

Existing kits ship dozens of agents and skills you'll never use, but every one of them sits in your context and burns tokens each turn. `tuncss-plan-kit` ships four files that cover the only loop most projects need: design → plan → execute (here or elsewhere) → record. That's it.

## License

MIT
