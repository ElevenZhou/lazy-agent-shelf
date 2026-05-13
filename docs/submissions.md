# 飞流AI枢纽提交规范

Updated: 2026-05-13

## 可以提交什么

欢迎提交以下类型：

- AI 网站：在线工具、资源站、模型站、榜单、学习站。
- 常用工具：软件、平台、模型、基础设施。
- Agent：可复用专家 Agent，遵循现有 `agents/<category>/<id>/` 结构。
- Skill：可复用能力或工具流程。
- 工作流：从输入到产出的完整流程。
- 项目：模板项目、开源项目、案例、可部署项目。
- 环境套件：新电脑初始化软件清单、网站书签、目录结构、安装脚本、Agent 接管指令。
- 个人工作台状态：资产、项目、关系、进展、风险、计划的结构化状态。
- 记忆：SOP、提示词、判断标准、踩坑经验。

## 提交方式

### 1. 让你的 Agent 直接提交

适合已经在 Codex、Claude Code、Cursor、OpenCode、Trae 等工具中工作的用户。

推荐指令：

```text
请按飞流AI枢纽提交规范，把我这个项目整理成一个 project 提交，补齐分类、标签、适合场景、安装步骤和关联 Agent。
```

Agent 应该：

1. 阅读 `docs/navigation-taxonomy.md` 与 `docs/submissions.md`。
2. 选择或新增合理分类。
3. 新增或修改对应内容文件。
4. 运行校验和构建命令。
5. 提交 PR 或给出变更摘要。

### 2. 使用 Codex 技能一句话提交

本仓库提供 `flaios-content-submit` 技能草案，位置：

```text
packages/codex-skills/flaios-content-submit/SKILL.md
```

安装到本机 Codex 技能目录后，可以直接说：

```text
使用 flaios-content-submit：把这个 GitHub 项目提交到飞流AI枢纽项目集市。
```

或：

```text
使用 flaios-content-submit：把 https://example.com 作为 AI网站导航条目提交，分类到 AI 搜索。
```

### 3. 在网站提交页面提交

网站会先展示提交类型、需要准备的字段、Agent 提交流程和人工提交入口。第一版先放说明与模板；后续可以接入表单、GitHub Issue、PR 自动生成或后台审核。

### 4. 直接提交 Pull Request

适合熟悉 Git 的贡献者：

1. Fork 仓库。
2. 按内容类型新增文件或修改现有文件。
3. 运行：

```bash
npm run catalog
npm run hub:catalog
npm run lint:hub
npm run lint:agents
npm run website:build
```

4. 提交 PR，并说明：内容类型、分类、推荐等级、是否本人实际使用过。

## 内容文件建议位置

| 内容类型 | 建议位置 |
| --- | --- |
| Agent | `agents/<category>/<agent-id>/` |
| Collection | `collections/<collection-id>/` |
| AI 网站 | `content/ai-websites.yaml` |
| 常用工具 | `content/tools.yaml` |
| Skill | `content/skills.yaml` 或 `packages/codex-skills/<skill-id>/` |
| 工作流 | `content/workflows.yaml` |
| 项目 | `content/projects.yaml` |
| 环境套件 | `setup-kits/<kit-id>/` 与 `content/setup-kits.yaml` |
| 个人工作台 | `workbench/*.yaml` |
| 记忆 | `content/memories.yaml` |

## 环境套件提交要求

环境套件必须至少包含：

```text
setup-kits/<kit-id>/
  kit.yaml
  apps.yaml
  apps.csv
  folders.yaml
  README.md
```

推荐包含：

```text
  websites.csv
  websites.yaml
  agent-prompts/general-setup-agent.md
  scripts/windows/bootstrap.ps1
```

软件条目必须优先写官方链接：

- `homepage`：软件官网。
- `download_url`：官方下载页或官方 GitHub Release，不允许个人服务器镜像。
- `github`：官方 GitHub 仓库或 Release 来源；没有则留空或写 `无`。

环境套件 CLI 验证：

```bash
node packages/cli/bin/lazy-agent-shelf.js setup show <kit-id>
node packages/cli/bin/lazy-agent-shelf.js setup export <kit-id> --out ./generated/setup-share
node packages/cli/bin/lazy-agent-shelf.js setup script <kit-id> --platform windows
node packages/cli/bin/lazy-agent-shelf.js setup agent <kit-id> --target codex --out ./generated/setup/codex
```

`setup export` 默认生成公开分享包；如需完整私人备份，才允许使用 `--include-private`。

## 个人工作台提交要求

个人工作台只呈现状态，不管理真实项目文件。更新时优先修改：

- `workbench/projects.yaml`
- `workbench/assets.yaml`
- `workbench/relations.yaml`
- `workbench/progress.yaml`
- `workbench/risks.yaml`
- `workbench/plans.yaml`

可使用 Codex Skill：

```text
使用 personal-workbench：根据这次对话更新 progress、risks 和 plans。
```

高风险事实必须由用户确认后再写入，包括财务、法律、医疗、账号、Token、密码、私人关系等。

## PR 检查清单

- [ ] `id` 稳定、唯一、使用 kebab-case。
- [ ] `type` 与内容一致。
- [ ] `category` 优先复用标准类目；新增类目已说明理由。
- [ ] `one_liner` 能一句话说明价值。
- [ ] `best_for` 与 `not_good_for` 都有内容。
- [ ] `owner_note` 写明真实使用经验或推荐理由。
- [ ] 高风险内容已写边界。
- [ ] 关联的 Agent / Skill / Workflow 尽量补齐。
- [ ] 已运行校验或说明未运行原因。
- [ ] 如果是环境套件，软件下载链接均为官方渠道。
- [ ] 如果包含浏览器历史或网站清单，已确认公开导出不会泄露私有后台、内网地址、账号页、API 入口或支付页。
- [ ] 如果是个人工作台更新，没有修改真实项目文件或敏感凭据。

## 审核口径

飞流AI枢纽不是大全，不追求数量。优先收录：

1. 老周或贡献者真实使用过的内容。
2. 能让 AI 新手少走弯路的内容。
3. 能和 Agent / Skill / Workflow 连接起来的内容。
4. 有清晰使用边界和替代方案的内容。
