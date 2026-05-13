<!-- tuncss-plan-kit:start -->
## Plan Kit

This project uses tuncss-plan-kit. Three slash commands are available:

- `/brainstorm` — turn an idea into an approved spec (writes to `docs/specs/`)
- `/plan-universal` — turn a spec into an executable plan (writes to `docs/plans/`)
- `/handoff-plan` — generate a paste-ready handoff for another LLM agent (writes to `docs/handoffs/`)

Plans contain an execution contract at the top. When asked for a specific task ("do TASK-03"), read only that task's block, stay inside its Targets, stop and report when Done When + Verification are satisfied.
<!-- tuncss-plan-kit:end -->
