# Usage Guide

Lazy Agent Shelf is not a chat website. The website is a catalog and command generator. The agents are used inside your AI coding tools after installation.

## Mental Model

- Website: browse agents, choose collections, pick a target platform, copy commands.
- CLI: converts the universal source files into platform-specific files.
- Target tool: Codex, Claude Code, Cursor, OpenCode, VSCode Copilot, Trae, or generic AGENTS.md uses the generated files.

## Basic Commands

```bash
npm install -g lazy-agent-shelf
lazy-agent-shelf list
lazy-agent-shelf collections
lazy-agent-shelf install code-reviewer --target codex --out ./generated/install
lazy-agent-shelf install-collection solo-founder-pack --target cursor --out .
lazy-agent-shelf install-collection code-quality-pack --target all --out ./generated/all-tools
```

## Where to Use Each Target

| Target | Output | Typical Use |
| --- | --- | --- |
| `codex` | `codex/skills/<agent>/SKILL.md` | Codex skills for local repo work and reusable workflows. |
| `claude` | `.claude/agents/<agent>.md` | Claude Code subagents. |
| `cursor` | `.cursor/rules/<agent>.mdc` | Cursor project rules. |
| `opencode` | `.opencode/agents/<agent>.md` | OpenCode agent markdown. |
| `vscode` | `.github/instructions/<agent>.instructions.md` | VSCode/GitHub Copilot project instructions. |
| `trae` | `.trae/agents/<agent>.md` | Trae-compatible prompt files. |
| `generic` | `AGENTS.md` | Portable repo-level agent instructions. |
| `all` | all target outputs | Prepare every supported platform at once. |

## Recommended Flow

1. Start on the website and search for the task you care about.
2. If you only need one expert, copy the single-agent install command.
3. If you want a working team, copy a collection command such as `solo-founder-pack` or `code-quality-pack`.
4. Run the command in your project or chosen output directory.
5. Open the target AI tool and ask for the task naturally, for example: "Use the code reviewer to check this change" or "Use Domain Brand Finder to name this SaaS." 

## Important Notes

- Generated files are plain Markdown or MDC files. You can inspect and edit them before using them.
- Some tools load project-level files only after reopening the project or restarting the tool.
- Do not commit personal/private workflow prompts to public repos unless you want them public.
- `--target all` is useful for publishing a repo that supports multiple AI tools.
