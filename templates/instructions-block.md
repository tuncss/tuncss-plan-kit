<!-- tuncss-plan-kit:start -->
## Plan Kit

This project uses tuncss-plan-kit. Four slash commands are available:

- `/brainstorm` — turn an idea into an approved spec (writes to `docs/specs/`)
- `/plan-universal` — turn a spec into an executable plan (writes to `docs/plans/`)
- `/handoff-plan` — generate a paste-ready handoff for another LLM agent (writes to `docs/handoffs/`)
- `/changelog` — record what changed, in plain sentences (writes to `docs/CHANGELOG.md`)

Plans contain an execution contract at the top. By default, run every task in order: after each task passes its Verification, write the changelog entry and commit; stop only on a stop condition (S1–S4). "do TASK-03" runs only that task.
<!-- tuncss-plan-kit:end -->
