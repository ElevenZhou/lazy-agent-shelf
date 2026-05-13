# Lazy Agent Shelf / 飞流AI枢纽

[![validate](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/validate.yml/badge.svg)](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/validate.yml)
[![pages](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/pages.yml/badge.svg)](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/pages.yml)
[![deploy-seoul](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/deploy-seoul.yml/badge.svg)](https://github.com/ElevenZhou/lazy-agent-shelf/actions/workflows/deploy-seoul.yml)
[![GitHub Pages](https://img.shields.io/badge/site-live-d7ff37?labelColor=17130d)](https://elevenzhou.github.io/lazy-agent-shelf/)
[![Seoul](https://img.shields.io/badge/agents.flaios.com-ready-d7ff37?labelColor=17130d)](https://agents.flaios.com/)
[![License: MIT](https://img.shields.io/badge/license-MIT-b64020.svg)](LICENSE)

![Lazy Agent Shelf preview](docs/assets/hero-preview.svg)

Lazy Agent Shelf is evolving into **飞流AI枢纽**: an open-source cross-tool AI usage hub based on Lao Zhou's everyday AI workflows. It lets users install curated expert agents once and export them to Claude Code, Codex, Cursor, OpenCode, VSCode Copilot, Trae, and generic AGENTS.md workflows.

The goal is simple: people are lazy, but good preset agents, skills, tools, websites, workflows, and project templates are powerful. This project turns practical AI usage into versioned, reusable, testable, and portable assets.

## What This Repo Provides

- A universal `agent.yaml` source format for agent metadata.
- High-quality `prompt.md` files with scope, workflow, safety boundaries, and outputs.
- A CLI prototype to list, lint, build, and install agents.
- Multi-target generators for Claude Code, Codex skills, Cursor rules, OpenCode agents, VSCode Copilot instructions, Trae-style prompts, and generic AGENTS.md bundles.
- A website prototype for browsing and recommending agents.
- A usage guide for where the generated agents actually run: `docs/usage.md`.
- A taxonomy and contribution system for AI websites, common tools, skills, workflows, projects, and reusable memories.
- Hub catalog generation from `content/*.yaml` and `setup-kits/*/kit.yaml`.
- Setup Kit detail pages with app groups, official links, folder plans, safety notes, public website directories, and copyable CLI commands.
- A Codex submission skill draft at `packages/codex-skills/flaios-content-submit/SKILL.md`.

## Quick Start

```bash
npm install
npm run catalog
npm run hub:catalog
npm run lint:hub
npm run lint:agents
npm run build:agents
node packages/cli/bin/lazy-agent-shelf.js list
node packages/cli/bin/lazy-agent-shelf.js install code-reviewer --target codex --out ./generated/install
node packages/cli/bin/lazy-agent-shelf.js install-collection solo-founder-pack --target cursor --out ./generated/install
node packages/cli/bin/lazy-agent-shelf.js install-collection code-quality-pack --target all --out ./generated/all-tools
```

Website preview:

```bash
npm run website:dev
```

Then open `http://127.0.0.1:5173/`.

After publishing to npm, the intended command shape is:

```bash
npx lazy-agent-shelf list
npx lazy-agent-shelf install code-reviewer --target codex
npx lazy-agent-shelf install-collection solo-founder-pack --target cursor
npx lazy-agent-shelf install-collection code-quality-pack --target all
npx lazy-agent-shelf setup list
npx lazy-agent-shelf setup show personal-ai-workstation
npx lazy-agent-shelf setup export personal-ai-workstation --out ./generated/setup-share
npx lazy-agent-shelf setup script personal-ai-workstation --platform windows --out ./generated/setup
npx lazy-agent-shelf setup agent personal-ai-workstation --target codex --out ./generated/setup/codex
```

## Agent Source Layout

```text
agents/<category>/<agent-id>/
  agent.yaml
  prompt.md
  examples.md

collections/<collection-id>/
  collection.yaml
```

`agent.yaml` is the portable source of truth. Generated platform files should not be edited by hand.

## Initial Collections

- `solo-founder-pack`: product, UI, API, copy, SEO, and social launch support.
- `code-quality-pack`: review, debugging, testing, security, and repo onboarding.
- `china-growth-pack`: Douyin ads, Xiaohongshu, WeChat, Feishu, ecommerce, and market research.
- `agent-maker-pack`: agent quality, prompt-injection safety, and packaging.
- `data-ops-pack`: data analysis, spreadsheets, backtests, and automation.

## Initial Targets

- `claude`: Claude Code subagent Markdown
- `codex`: Codex skill `SKILL.md`
- `cursor`: Cursor `.mdc` rule
- `opencode`: OpenCode agent Markdown
- `vscode`: GitHub Copilot instruction Markdown
- `trae`: Trae-compatible prompt Markdown
- `generic`: AGENTS.md section

## Project Principles

- Quality beats raw count.
- Every agent must have a clear scope and non-scope.
- Every agent must define expected outputs and safety boundaries.
- One source format should compile into multiple AI tools.
- Chinese and global workflows should both be first-class.
- This is not a raw link dump: prioritize real use, clear boundaries, and connection to workflows.

## Hub Expansion

The Chinese product name is **飞流AI枢纽**. The hub now organizes content into:

- AI website navigation.
- Common tools.
- Agent shelf.
- Skill shelf.
- Workflows.
- Personal workbench for assets, projects, relations, progress, risks, and plans.
- Setup kits for personal AI workstation initialization.
- Project market.
- Reusable memories and guides.

Hub source files:

```text
content/
  ai-websites.yaml
  tools.yaml
  skills.yaml
  workflows.yaml
  projects.yaml
  setup-kits.yaml
  memories.yaml

setup-kits/
  personal-ai-workstation/
    kit.yaml
    apps.yaml / apps.csv
    websites.yaml / websites.csv
    folders.yaml
    agent-prompts/general-setup-agent.md
    scripts/windows/bootstrap.ps1

workbench/
  workbench.yaml
  projects.yaml
  assets.yaml
  relations.yaml
  progress.yaml
  risks.yaml
  plans.yaml
```

Generated website data:

```bash
npm run hub:catalog
```

This writes `packages/website/src/hub-catalog.json`.

The generated hub catalog also includes `workbench` data when `workbench/*.yaml` exists. The website renders it as the `个人工作台` tab.

Contribution and taxonomy docs:

- `docs/navigation-taxonomy.md`
- `docs/submissions.md`
- `schemas/content-item.schema.json`

Setup kit CLI examples:

```bash
node packages/cli/bin/lazy-agent-shelf.js setup list
node packages/cli/bin/lazy-agent-shelf.js setup show personal-ai-workstation
node packages/cli/bin/lazy-agent-shelf.js setup export personal-ai-workstation --out ./generated/setup-share
node packages/cli/bin/lazy-agent-shelf.js setup export personal-ai-workstation --out ./generated/setup-private --include-private
node packages/cli/bin/lazy-agent-shelf.js setup script personal-ai-workstation --platform windows
node packages/cli/bin/lazy-agent-shelf.js setup agent personal-ai-workstation --target codex --out ./generated/setup/codex
```

`setup export` defaults to a public-safe website export and filters local IPs plus likely private admin/API domains. Use `--include-private` only for a private backup package.

The setup kit website view shows app cards with official actions:

- GitHub icon: opens the app's GitHub repository or release source.
- 官网: opens the official homepage.
- 下载: opens the official download URL from the app inventory.

Downloads should always point to official vendor pages or official GitHub Releases, never to a private mirror.

## Roadmap

See `docs/roadmap.md`.

## Recent Updates

- 2026-05-13: Added setup kit CLI commands, public-safe setup export, setup kit detail pages, official app links, and website directory rendering.
- 2026-05-13: Added the first `个人工作台` data layer, website tab, and `personal-workbench` Codex skill for status-only personal state updates.
- 2026-05-13: Added Hub catalog generation and validation for AI websites, tools, skills, workflows, projects, setup kits, and memories.
- 2026-05-10: Moved website navigation into the top logo bar, split common scenarios into an independent tab, and added an `AI使用入门` guide.
- 2026-05-10: Added website navigation channels for AI tool scene analysis and a top-10 model watchlist.
- 2026-05-10: Added `douyin-ad-optimizer` and a Douyin ecosystem agent opportunity list.
- 2026-05-10: Added scenario-first discovery with multidimensional `scenarios` tags for work scenes like Douyin ops, overseas ads, game development, quant trading, and A-share T0.
- 2026-05-10: Added four scenario agents for overseas ads, short-drama production, game prototype planning, and A-share T0 strategy research.
- 2026-05-10: Added Seoul server deployment workflow for `https://flaios.com/lazy-agent-shelf/`.
- 2026-05-10: Prepared root-path Seoul deployment for `https://agents.flaios.com/`.
- 2026-05-10: Aligned the website title, slogan, default language, and hero copy with the FlaiOS brand system.
- 2026-05-10: Bumped package version to `0.1.1` for the multilingual website update.
- 2026-05-10: Added website language switching for English and Chinese, with localized agent and collection summaries in the generated catalog.

