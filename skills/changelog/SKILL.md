---
name: changelog
description: Use when a plan task has just been completed, or when the user runs /changelog, to append a short entry describing what actually changed to docs/CHANGELOG.md.
---

# Changelog

Append a short, concrete record of what changed to `docs/CHANGELOG.md`. The reader is a teammate who did not do the work and wants to know what is different now. Commit messages already failed at this — do not write another one.

**Announce at start:** "Writing the changelog entry."

## Two ways in

**From a completed plan task.** Rule 6 of the plan's execution contract sends you here once Done When and Verification are satisfied. You have the task id, the task name, and the plan path.

**From `/changelog`.** The user invoked it directly for work done outside the plan flow. There is no task id and no plan path.

If a task's verification failed, do not write an entry at all. That work is usually not merged, and recording it would put a change that did not happen into the log.

## Gather the facts first

Run these before writing anything. Never write an entry from memory of what you set out to do — write it from what actually landed.

- `git diff` and `git diff --staged` — the real change
- `git config user.name` — the author name

The diff is your source, not your content: it tells you what to write about, and none of it is copied into the entry.

If both diffs are empty and nothing was just committed for this work, stop and tell the user there is nothing to record.

## How to write the bullets

This is the whole skill. Everything else is placement.

1. Every bullet names the thing that changed.
2. If a value changed, give **old → new**.
3. Banned: any phrasing that does not say what became what. "Improved", "refactored", "fixed issues", "optimized", "cleaned up", "enhanced" — and their equivalents in any language.
4. One to five bullets per entry. If you need more than five, say so in your report to the user: the task was too large. Write the entry anyway.
5. Write in the language the repository uses. This skill is in English; the entries it produces are not necessarily.

Good:
- `Read threshold lowered from -60 dB to -80 dB`
- `Token validation moved out of every handler into a single requireAuth middleware`
- `Session lifetime cut from 24 hours to 2 hours`

Bad:
- `Improved bluetooth reliability` — what became what?
- `Refactored auth` — same.
- `Various fixes` — same.

## Entry shape

For a plan task:

```markdown
### <task name> — TASK-NN · <author> · [plan](<plan path>)
- <bullet>
- <bullet>
```

For off-plan work:

```markdown
### <short name> — off-plan · <author>
- <bullet>
```

The `off-plan` label is written in the repository's language, like the bullets.

If `git config user.name` is empty, drop both the author and the `·` that separates it. Never invent a name.

## Where it goes

The file is `docs/CHANGELOG.md`. Create it if missing, with `# Changelog` as the first line.

Entries are grouped under date headings, newest first:

```markdown
# Changelog

## 2026-09-04

### Auth middleware — TASK-03 · Mustafa TUNÇ · [plan](docs/plans/2026-09-02-auth.md)
- Token validation moved out of every handler into a single requireAuth middleware
- Response on an invalid token changed from 200 with an empty body to 401
```

Placement rule — follow it exactly, so that three people's agents do not grow the file from three different places:

- If today's date heading already exists, append the entry at the end of that section.
- If it does not, insert a new date heading immediately after the `# Changelog` line.

## Do not commit

Leave the entry in the working tree next to the change. Whoever commits the work commits the entry with it, so `git log -p docs/CHANGELOG.md` always pairs a line with the change that produced it.
