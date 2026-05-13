# 飞流AI枢纽导航与分类规范

Updated: 2026-05-13

## 中文名

项目中文名：**飞流AI枢纽**。

含义：

- **飞流**：对应 FlaiOS / Flow OS，强调 AI 工具、Agent、Skill、工作流之间的流动与编排。
- **AI枢纽**：不是普通网址导航，而是面向真实工作和学习的 AI 使用入口。

一句话定位：

> 飞流AI枢纽是基于老周日常 AI 使用经验沉淀的工具、网站、Agent、Skill、工作流与项目精选导航。

## 信息架构

第一版主导航：

1. **Agent货架**：可安装、可迁移、可复用的专家 Agent。
2. **AI网站导航**：按任务分类发现 AI 网站与在线服务。
3. **入门指南**：AI 学习路线、工具选择、Prompt / Agent / Skill 基础。
4. **常用工具**：老周高频使用的软件、网站、模型与平台。
5. **工作流**：把工具、Agent、Skill 串成可执行流程。
6. **个人工作台**：呈现个人资产、项目、关系、进展、风险和计划。
7. **环境套件**：新电脑初始化、软件清单、网站书签、目录结构和 Agent 接管指令。
8. **项目集市**：可复用项目、模板、案例和开源项目。
9. **提交入口**：说明如何由人或 Agent 提交内容。

后续内容足够多时，可把 **Skill货架** 与 **老周记忆库** 提升为一级导航。

## 顶层内容类型

统一使用 `type` 字段标识内容类型：

| type | 中文名 | 用途 |
| --- | --- | --- |
| `agent` | Agent | 专家角色、任务流程、可导出到 AI 工具 |
| `skill` | Skill | 可复用能力、工具调用说明、确定性流程 |
| `ai_website` | AI网站 | 在线 AI 网站、Web 服务、资源入口 |
| `tool` | 常用工具 | 高频使用的软件、平台、模型、基础设施 |
| `workflow` | 工作流 | 多步骤流程，连接工具、Agent、Skill 和产出物 |
| `project` | 项目 | 模板、开源项目、案例、可部署项目 |
| `setup_kit` | 环境套件 | 新电脑初始化、软件清单、书签、目录和 Agent 接管指令 |
| `memory` | 记忆 | 经验、SOP、偏好、踩坑、判断标准 |
| `guide` | 指南 | 入门教程、方法论、工具选择说明 |

## 标准分类

分类使用 `category`，建议格式为 `domain/subdomain`。允许自定义，但要优先复用现有类目。

### 通用领域

- `ai/chat`：AI 对话与通用助手
- `ai/search`：AI 搜索、研究、资料检索
- `ai/coding`：AI 编程、代码助手、IDE
- `ai/writing`：写作、长文、编辑、翻译
- `ai/image`：图片生成、设计、素材
- `ai/video`：视频生成、剪辑、短视频
- `ai/audio`：语音、音乐、播客、转写
- `ai/slides-docs`：PPT、文档、知识呈现
- `ai/automation`：自动化、RPA、工作流编排
- `ai/data`：数据分析、表格、BI、数据库
- `ai/knowledge`：知识库、笔记、个人记忆
- `ai/model-api`：模型、API、推理平台
- `ai/learning-news`：学习、资讯、榜单、社区

### 工作领域

- `engineering/frontend`
- `engineering/backend`
- `engineering/code-quality`
- `product/strategy`
- `product/ux`
- `growth/marketing`
- `growth/seo`
- `growth/ads`
- `content/social`
- `content/ecommerce`
- `data/analysis`
- `data/trading`
- `ops/automation`
- `ops/devops`
- `setup/windows`
- `setup/mac`
- `setup/ai-workstation`
- `setup/developer-workstation`
- `setup/creator-workstation`
- `local-cn/feishu`
- `local-cn/wechat`
- `local-cn/xiaohongshu`
- `local-cn/douyin`

## 自定义类目规则

贡献者可以增加自定义 `category`，但必须满足：

1. 使用小写英文、数字和短横线，层级用 `/`。
2. 先查 `docs/navigation-taxonomy.md` 是否已有可复用类目。
3. 新类目必须在提交中说明：适用范围、为什么不能复用旧类目、至少 2 个未来可收录内容。
4. 不要按品牌创建顶级类目，例如不要新增 `chatgpt/*`，应归入 `ai/chat` 或 `ai/model-api`。
5. 不要按个人临时任务创建类目，例如不要新增 `my-tuesday-task`，应归入稳定场景。

## 标签规范

`tags` 用于多维检索，建议包含：

- 使用方式：`free-trial`、`paid`、`login-required`、`open-source`、`self-hosted`
- 使用地区：`global`、`china-friendly`、`china-unstable`
- 用户类型：`beginner-friendly`、`developer`、`creator`、`operator`、`solo-founder`
- 输出类型：`text`、`image`、`video`、`code`、`report`、`workflow`
- 推荐等级：`laozhou-s`、`laozhou-a`、`watch`

## 推荐等级

- `S`：老周高频使用，强烈推荐。
- `A`：好用，适合多数人。
- `B`：可用，但有明显替代品。
- `C`：只适合特定场景。
- `Watch`：值得关注，但仍需观察。

## 最小内容字段

所有非 Agent 内容建议包含：

```yaml
id: stable-kebab-id
type: ai_website
name: Example
url: https://example.com
category: ai/search
tags: [beginner-friendly, free-trial]
one_liner: 一句话说明它解决什么问题。
best_for:
  - 适合场景
not_good_for:
  - 不适合场景
rating: A
owner_note: 老周自己的使用备注。
related_agents: []
related_skills: []
related_workflows: []
status: draft
```

## 环境套件字段补充

环境套件由 `content/setup-kits.yaml` 的索引条目与 `setup-kits/<kit-id>/kit.yaml` 的实体元数据共同组成。网站会读取：

- `kit.yaml`：名称、描述、模式、入口文件、安全规则。
- `apps.yaml`：软件清单、优先级、安装方式、官方链接。
- `folders.yaml`：推荐目录结构。
- `websites.csv`：经公开过滤后展示网站目录和生成书签。

`apps.yaml` 软件条目建议字段：

```yaml
- id: litemonitor
  name: LiteMonitor
  category: system-monitor
  priority: recommended
  install_mode: auto
  homepage: https://litemonitor.cn/
  download_url: https://github.com/Diorser/LiteMonitor/releases
  github: https://github.com/Diorser/LiteMonitor
  purpose: 轻量级 Windows 性能监控工具
  latest_known: 2026年2月12日 (v1.3.4)
  platforms:
    windows:
      install:
        method: winget
        id: Diorser.LiteMonitor
  login_required: false
  secret_required: false
```

链接规则：

- `github` 显示为 GitHub 图标按钮。
- `homepage` 显示为“官网”。
- `download_url` 显示为“下载”。
- `download_url` 必须是官方渠道或官方 GitHub Release，不使用个人服务器镜像。

## 个人工作台字段补充

个人工作台位于 `workbench/`，是状态展示层，不直接编辑真实项目文件。

```text
workbench/
  workbench.yaml
  projects.yaml
  assets.yaml
  relations.yaml
  progress.yaml
  risks.yaml
  plans.yaml
```

项目状态建议：

- `active`
- `paused`
- `blocked`
- `watching`
- `done`
- `archived`

项目阶段建议：

- `idea`
- `research`
- `planning`
- `building`
- `testing`
- `launched`
- `operating`
- `archived`

风险等级建议：

- `low`
- `medium`
- `high`
- `critical`

## 审核原则

- 先说明真实用途，再给链接。
- 不收录纯广告、返利导向、无法判断用途的站点。
- 涉及医疗、法律、金融投资等高风险领域时必须标记限制与人工复核。
- 免费、付费、登录、国内访问稳定性要尽量写清楚。
- Agent / Skill / Workflow 必须有明确输入、输出和边界。
