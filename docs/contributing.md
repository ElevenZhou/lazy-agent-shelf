# Contributing Agents

## Add a New Agent

1. Create `agents/<category>/<agent-id>/`.
2. Add `agent.yaml`, `prompt.md`, and `examples.md`.
3. Run `npm run lint:agents`.
4. Run `npm run build:agents` and inspect generated output for at least one target.
5. Open a pull request with the agent purpose and example tasks.

## Quality Bar

A good agent should make users faster without making them less safe. The agent must have:

- Clear scope and non-scope.
- Evidence-first workflow.
- Specific input and output expectations.
- Safety boundaries.
- Verification or review guidance.
- No claims that require hidden credentials, production access, or private data.

## Avoid

- Duplicating an existing agent with a different name.
- Generic persona prompts with no workflow.
- Agents that encourage secret exposure or destructive commands.
- Platform-only prompts that cannot be converted.
