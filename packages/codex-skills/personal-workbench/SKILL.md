---
name: personal-workbench
description: Use when the user wants to update, review, summarize, or add structured personal workbench state for assets, projects, relations, progress, risks, and plans in the FlaiOS / 飞流AI枢纽 repository. This skill reads and edits workbench/*.yaml only and must not edit real project files unless explicitly requested separately.
---

# Personal Workbench

Maintain the `workbench/` state layer for 飞流AI枢纽.

## Scope

Use this skill to:

- Add or update projects in `workbench/projects.yaml`.
- Record progress in `workbench/progress.yaml`.
- Update risks in `workbench/risks.yaml`.
- Update plans in `workbench/plans.yaml`.
- Add assets or relations in `workbench/assets.yaml` and `workbench/relations.yaml`.
- Summarize the current personal state for the user.

Do not use this skill to edit real project files, credentials, financial records, or private documents. The workbench presents status only.

## Workflow

1. Read `workbench/workbench.yaml` first.
2. Read the specific module files needed for the request.
3. Preserve existing IDs and fields; append new entries when in doubt.
4. Use stable kebab-case IDs.
5. For high-risk facts involving finance, legal, health, accounts, tokens, or private relationships, ask for confirmation before writing.
6. Update only `workbench/*.yaml` unless the user explicitly asks for docs or website changes.
7. Run `npm run hub:catalog` after edits when inside the repository.
8. Final response: list changed files, new/updated IDs, and any assumptions.

## Status Values

Projects:

- `active`
- `paused`
- `blocked`
- `watching`
- `done`
- `archived`

Stages:

- `idea`
- `research`
- `planning`
- `building`
- `testing`
- `launched`
- `operating`
- `archived`

Risk levels:

- `low`
- `medium`
- `high`
- `critical`

## Example Request

```text
使用 personal-workbench：把飞流AI枢纽更新为 active，阶段 building，下一步是完成个人工作台栏目。
```
