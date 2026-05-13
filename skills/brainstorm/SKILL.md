---
name: brainstorm
description: Use before any feature, component, or behavior change. Turns an idea into an approved design before any code is written.
---

# Brainstorming

Turn an idea into a design the user approves, then hand off to plan-universal. No code, no scaffolding, no implementation skill until the design is approved.

<HARD-GATE>
Do NOT write code, scaffold, edit files for the feature, or invoke an implementation skill until you have presented a design and the user has approved it. This applies to every project regardless of size.
</HARD-GATE>

## "This is too simple to need a design"

It isn't. A todo list, a one-file utility, a config tweak — all go through this. Simple-looking projects are where unexamined assumptions cost the most rework. The design can be three sentences for a trivial change. You still present it, you still get approval.

## Checklist

Work through these in order. Don't skip ahead.

1. Explore project context — relevant files, recent commits, any existing docs
2. Assess scope — if the request is actually several independent projects, decompose before going deeper
3. Ask clarifying questions — one per message, multiple-choice when you can
4. Propose 2-3 approaches — trade-offs and your recommendation
5. Present the design section by section, getting approval after each
6. Write the spec to `docs/specs/YYYY-MM-DD-<topic>-design.md`
7. Self-review the spec — placeholders, contradictions, ambiguity, scope
8. Wait for the user to review the written spec
9. Hand off — ask the user to run `/plan-universal` (or implement directly only if trivial; see Hand-off)

## Scope assessment

Before any clarifying questions, look at the request as a whole. If it describes multiple independent subsystems ("a platform with chat, billing, file storage, and analytics"), don't refine details — that's wasted effort on something that needs to be decomposed first.

When the request is too large for a single spec:
- Name the independent pieces and how they relate
- Suggest a build order
- Brainstorm only the first sub-project through this flow
- Each sub-project gets its own spec → plan → implementation cycle

## Asking clarifying questions

- One question per message. If a topic needs more, break it into multiple turns.
- Prefer multiple-choice. Open-ended is fine when the space is genuinely open.
- Focus on purpose, constraints, and what success looks like.
- Don't ask about anything you can derive from reading the code.

**If the user dumps answers in bulk** (numbered list answering several questions at once, or "just go ahead with X, Y, Z"), do NOT take it as permission to skip the gate. Acknowledge the answers, then ask 1-2 follow-ups on what those answers leave open — trade-offs, edge cases, or the next decision their choices imply ("LocalStorage confirmed — should we handle data clearing or schema versioning?"). Only move to approaches once those are resolved.

## Proposing approaches

Once you understand the goal, lay out 2-3 ways to solve it. Each gets its trade-offs in plain language. Lead with the one you'd pick and say why. Don't hide your recommendation behind false neutrality — but make it easy for the user to override.

## Presenting the design

Present in sections. Scale each section to its complexity:
- A few sentences for something straightforward
- Up to ~300 words when it's nuanced

After each section, ask if it looks right before moving on. Cover what's actually relevant: architecture, components, data flow, error handling, testing. Skip what doesn't apply.

If something doesn't fit together, go back and clarify. The point of these gates is to catch confusion before it lands in the spec.

## Designing for isolation

Break the system into small units that each have one purpose, talk to each other through clear interfaces, and can be understood and tested on their own.

For each unit, you should be able to answer:
- What does it do?
- How do you use it?
- What does it depend on?

If a consumer has to read the internals to use a unit, the boundary is wrong. If you can't change internals without breaking consumers, the boundary is wrong. Smaller, well-bounded units are also easier to work with later — edits get more reliable when files are focused.

## Working inside an existing codebase

- Read the surrounding code first. Follow the patterns already there.
- If existing code in the area has real problems that affect this work (an oversized file, tangled responsibilities, unclear boundaries), include the targeted improvement in the design — the way a careful developer cleans up the room they're working in.
- Don't bundle unrelated refactoring. Stay on what serves the goal.

## YAGNI

Cut anything the request doesn't need yet. Future-proofing, config options "just in case", an abstraction for a hypothetical second consumer — all out, unless the user has actually named the second consumer.

## Writing the spec

After every section is approved, write the spec to `docs/specs/YYYY-MM-DD-<topic>-design.md` (override if the user has set a different location). Create `docs/specs/` if it doesn't exist. Commit the file.

The spec is the document a future implementer reads. It captures decisions, not your reasoning trail. Keep it tight.

## Spec self-review

Re-read with fresh eyes. Fix issues inline; no second review pass.

1. **Placeholders** — any "TBD", "TODO", or vague requirement? Resolve them.
2. **Internal consistency** — do sections contradict each other? Does the architecture match the feature description?
3. **Scope** — is this still a single implementation plan, or did it grow into something that needs decomposing?
4. **Ambiguity** — could a requirement be read two different ways? Pick one and make it explicit.

## User review gate

After your self-review, ask the user to read the written spec:

> Spec written and committed to `<path>`. Please review it and let me know if you want changes before we move to the implementation plan.

Wait for their response. If they ask for changes, make them and re-run the self-review. Only move on once they approve.

## Hand-off

After the spec is approved, **do NOT start implementing**. The skill ends here. The next step is `/plan-universal`, which turns the spec into an executable plan with model-tier hints and per-task verification.

End your final turn with this message to the user (paraphrase, but keep all four parts):

> Spec is locked at `<path>`. Want me to write the implementation plan via `/plan-universal`? Or, if this is small enough — one file, no new public API, no schema or migration changes, no new dependency — say "implement directly" and I'll do it now.

Then **stop and wait** for the user's choice. Default is `/plan-universal`. Implement directly **only** when:
- The user explicitly says so (the phrase "implement directly" or equivalent)
- **AND** the change meets every trivial criterion above

If you find yourself thinking "the spec is small, I'll just knock it out" — that's the drift this gate exists to catch. Stop. Hand off.

Do not invoke any other skill from this skill.

## Key principles

- One question at a time
- Multiple choice when you can
- YAGNI hard
- Always explore 2-3 approaches before settling
- Approve as you go — don't drop a wall of design and ask "thoughts?"
- Be willing to back up when something doesn't fit
