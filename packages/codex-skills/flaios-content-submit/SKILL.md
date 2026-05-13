---
name: flaios-content-submit
description: Use when the user wants to submit a website, tool, project, Agent, Skill, workflow, or personal memory into the FlaiOS / 飞流AI枢纽 repository from a short natural-language request. Helps classify, normalize, create files, and prepare PR-ready changes.
---

# FlaiOS Content Submit

Turn a one-line user request into a structured contribution for 飞流AI枢纽.

## Quick Trigger Examples

- "把这个 GitHub 项目提交到飞流AI枢纽项目集市。"
- "把 https://example.com 加到 AI网站导航，分类到 AI 搜索。"
- "把我这个常用提示词沉淀成一个 memory。"
- "把这个流程整理成工作流提交。"

## Workflow

1. Locate the repository root by finding `package.json` with `lazy-agent-shelf` or `docs/navigation-taxonomy.md`.
2. Read `docs/navigation-taxonomy.md` and `docs/submissions.md` before editing.
3. Identify `type`: `ai_website`, `tool`, `agent`, `skill`, `workflow`, `project`, `memory`, or `guide`.
4. Pick the closest existing `category`; only add a custom category when necessary and explain why.
5. Add or update the appropriate file:
   - AI websites: `content/ai-websites.yaml`
   - Tools: `content/tools.yaml`
   - Skills: `content/skills.yaml` or `packages/codex-skills/<skill-id>/SKILL.md`
   - Workflows: `content/workflows.yaml`
   - Projects: `content/projects.yaml`
   - Memories: `content/memories.yaml`
   - Agents: existing `agents/<category>/<agent-id>/` convention
6. Fill: `id`, `type`, `name`, `category`, `tags`, `one_liner`, `best_for`, `not_good_for`, `rating`, `owner_note`, related links, and `status: draft` unless asked to publish.
7. If the request lacks facts, infer conservatively and mark uncertain details in `owner_note` or leave optional fields empty.
8. Run validation when possible:
   - `npm run catalog`
   - `npm run lint:agents`
   - `npm run website:build`
9. Final response: list changed files, chosen category, rating, validation results, and any missing info.

## Quality Rules

- Prefer real use cases over generic descriptions.
- Do not overclaim availability, legality, pricing, or safety.
- For high-risk domains such as finance, medical, legal, and security, add explicit limitations.
- Do not submit pure ads, affiliate spam, or content with no clear user value.
- Connect new content to existing Agents, Skills, or Workflows whenever helpful.

## One-line Submission Template

```text
使用 flaios-content-submit：把 <链接/项目/想法/文件> 作为 <AI网站/工具/项目/工作流/记忆/Skill/Agent> 提交到飞流AI枢纽，面向 <用户/场景>，我的评价是 <S/A/B/C/Watch>。
```
