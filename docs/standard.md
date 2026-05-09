# Universal Agent Standard

A universal agent is a portable source package with metadata, instructions, examples, and quality requirements.

## Required Files

- `agent.yaml`: identity, compatibility, inputs, outputs, and quality checklist.
- `prompt.md`: platform-neutral expert instructions.
- `examples.md`: example user prompts and expected behavior.

## Collection Files

Collections live in `collections/<collection-id>/collection.yaml`. A collection is an installable pack of related agents for a workflow such as solo-founder launch, code quality, China growth, or data operations.

Required collection fields:

- `id`
- `name`
- `description`
- `agents`

Recommended collection fields:

- `zh_name`
- `tags`
- `use_cases`

## Authoring Rules

- Define when to use the agent and when not to use it.
- Start from evidence before recommendation.
- Include safety boundaries.
- Define concrete outputs.
- Avoid platform-specific syntax in `prompt.md` unless the agent is platform-specific.
- Prefer small, composable agents over broad all-purpose personas.

## Compatibility Model

The `compatible` list is declarative. It says which generators are expected to produce usable output. The CLI may later add platform-specific capability checks.

Current target names:

- `claude-code`
- `codex`
- `cursor`
- `opencode`
- `vscode-copilot`
- `trae`
- `generic`
