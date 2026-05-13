# 个人 AI 工作站 Setup Kit

这是一个用于“新电脑初始化 + AI 入门 + Agent 接管执行”的 MVP 套件，准备集成到 Lazy Agent Shelf 项目中。

当前目标不是一次性做成完整产品，而是先完成阶段 1：个人可用、本地有表格兜底、结构化数据可继续生成网站/脚本/Agent Prompt。

## 当前状态

已创建目录：

```text
setup-kits/personal-ai-workstation/
  kit.yaml
  apps.csv
  apps.yaml
  websites.csv
  websites.yaml
  folders.yaml
  README.md
  agent-prompts/
    general-setup-agent.md
  scripts/
    windows/
      bootstrap.ps1
```

当前也会被主项目的 Hub Catalog 读取，并展示在网站 `环境套件` 栏目中。

已完成内容：

- 从用户提供的软件列表生成 `apps.csv`。
- 从 `apps.csv` 生成结构化 `apps.yaml`。
- 从 Chrome 最近 30 天历史中提取“至少访问 2 次、Top 100 域名”，生成 `websites.csv`。
- 从 `websites.csv` 生成结构化 `websites.yaml`。
- 创建 `folders.yaml`，描述推荐工作区目录结构。
- 创建 `kit.yaml`，作为 setup kit 入口元数据。
- 创建 `agent-prompts/general-setup-agent.md`，用于交给 Codex / Claude / Trae 接管初始化。
- 创建并修复 Windows 初始化脚本 `scripts/windows/bootstrap.ps1`，支持 DryRun 和执行报告。
- 已接入主项目 CLI：
  - `setup list`
  - `setup show personal-ai-workstation`
  - `setup export personal-ai-workstation`
  - `setup script personal-ai-workstation --platform windows`
  - `setup agent personal-ai-workstation --target codex`
- 已接入网站详情页：展示软件分组、目录结构、安全规则、公开网站目录、可复制命令。
- 软件卡片展示官方操作入口：GitHub、官网、下载。下载链接必须指向官方渠道或官方 GitHub Release。

注意：`bootstrap.ps1` 已修复 Windows PowerShell 5.1 下的 UTF-8 解析问题，支持 `-DryRun` 预演和 `setup-report.md` 执行报告；真实安装前仍建议先运行 DryRun。

## 产品定位

这个模块建议作为 Lazy Agent Shelf 的新能力：

```text
Lazy Agent Shelf
  Agents
  Collections
  AI 使用入门
  Setup Kits       # 新增
```

Setup Kit 解决的问题：

1. 用户经常部署新 Windows / Mac，或者帮朋友初始化电脑。
2. 需要一个任何地方都能直接访问的展示页。
3. 需要快速打开官网、下载地址、GitHub Release。
4. 需要看到最新版本号和更新时间。
5. 需要能生成脚本，批量下载安装。
6. 需要能生成浏览器书签或网站清单。
7. 需要能生成 Agent 指令，让 AI 接管安装、导入书签、配置环境。
8. 本地必须有 CSV 表格作为最低保障。

一句话定位：

> 把每次换电脑都要重复做的事，沉淀成可展示、可分享、可执行、可交给 Agent 的初始化套件。

## 推荐架构

未来建议扩展为：

```text
setup-kits/
  personal-ai-workstation/
    kit.yaml
    apps.csv
    apps.yaml
    websites.csv
    websites.yaml
    folders.yaml
    ai-tools.yaml
    accounts-checklist.md
    README.md
    scripts/
      windows/
        bootstrap.ps1
        install-apps.ps1
        import-bookmarks.ps1
        setup-folders.ps1
        setup-ai-tools.ps1
      mac/
        bootstrap.sh
        Brewfile
        import-bookmarks.sh
        setup-folders.sh
        setup-ai-tools.sh
    agent-prompts/
      codex-install-agent.md
      claude-install-agent.md
      general-setup-agent.md
    exports/
      bookmarks.html
      software-list.csv
      setup-report-template.md
```

未来可继续增加：

```text
setup-kits/
  personal-ai-workstation/   # 用户自己的 AI 工作站
  friend-basic-setup/        # 给朋友装机的轻量版
  windows-ai-starter/        # Windows AI 入门
  mac-ai-starter/            # Mac AI 入门
  developer-workstation/     # 开发者电脑
  trader-workstation/        # 交易/量化电脑
  creator-workstation/       # 内容创作电脑
```

## 数据设计

本地保底用 CSV，系统源数据用 YAML。

原因：

- CSV 适合 Excel / 飞书表格 / 离线查看。
- YAML 适合脚本、网站、CLI、Agent Prompt 读取。
- 网站展示、脚本生成、书签生成、版本检查都可以从 YAML 派生。

### apps.yaml 建议字段

```yaml
- id: vscode
  name: "VS Code"
  category: "editor"
  priority: "required"
  install_mode: "auto"
  homepage: "https://code.visualstudio.com/"
  download_url: "https://code.visualstudio.com/download"
  github: "https://github.com/microsoft/vscode"
  purpose: "轻量级但功能强大的源代码编辑器"
  latest_known: "2026年5月6日 (v1.119.0)"
  platforms:
    windows:
      install:
        method: "winget"
        id: "Microsoft.VisualStudioCode"
    mac:
      install:
        method: "brew_cask"
        id: "visual-studio-code"
  login_required: false
  secret_required: false
```

字段含义：

| 字段 | 用途 |
|---|---|
| `id` | 稳定标识，脚本和网站使用 |
| `name` | 展示名 |
| `category` | 软件分类 |
| `priority` | required / recommended / optional |
| `install_mode` | auto / semi_auto / manual |
| `homepage` | 官网按钮 |
| `download_url` | 下载按钮 |
| `github` | GitHub / Release 检查 |
| `latest_known` | 离线可见的版本信息 |
| `platforms` | Windows / macOS 安装方式 |
| `login_required` | 是否需要登录 |
| `secret_required` | 是否涉及 API Key / Token / 订阅 |

### websites.yaml 建议字段

```yaml
- domain: "chatgpt.com"
  name: "ChatGPT"
  url: "https://chatgpt.com/"
  group: "ai"
  visit_count_30d: 20
  typed_count_30d: 3
  last_visit_at: "2026-05-12 12:00:00"
```

当前 `websites.yaml` 来自 Chrome 历史，可能包含私人后台、内网地址或工作域名。对外发布前必须人工清理。

## 网站展示规划

已在飞流AI枢纽网站新增 `环境套件 / Setup Kits` 页面。

页面结构：

```text
Setup Kits
  - 个人 AI 工作站
  - 给朋友快速装机版
  - Windows AI 入门电脑
  - Mac AI 入门电脑
  - 开发者电脑
  - 交易/量化电脑
```

单个 Kit 页面建议包含：

1. 概览：适用人群、平台、安装模式。
2. 必装软件：required。
3. 推荐软件：recommended。
4. 可选软件：optional。
5. 常用网站：按 group 展示。
6. 推荐目录结构。
7. 账号登录清单。
8. 一键脚本下载。
9. Agent 接管指令。
10. CSV / bookmarks.html / Markdown 导出。

软件卡片建议展示：

- 名称
- 类别
- 用途
- 优先级
- GitHub：官方 GitHub 仓库或 Release 来源
- 官网：官方主页
- 下载：官方渠道下载页，不使用个人服务器镜像
- 官网按钮
- 下载按钮
- GitHub 按钮
- 最新版本 / 更新时间
- Windows 安装方式
- macOS 安装方式
- 是否可自动安装
- 是否需要登录
- 是否涉及密钥

## CLI 规划

已在 `packages/cli` 中增加 setup 命令。

当前命令形态：

```bash
node packages/cli/bin/lazy-agent-shelf.js setup list
node packages/cli/bin/lazy-agent-shelf.js setup show personal-ai-workstation
node packages/cli/bin/lazy-agent-shelf.js setup export personal-ai-workstation --out ./generated/setup-share
node packages/cli/bin/lazy-agent-shelf.js setup export personal-ai-workstation --out ./generated/setup-private --include-private
node packages/cli/bin/lazy-agent-shelf.js setup script personal-ai-workstation --platform windows --out ./generated/setup
node packages/cli/bin/lazy-agent-shelf.js setup agent personal-ai-workstation --target codex --out ./generated/setup/codex
```

`setup export` 默认生成公开分享包，会过滤内网 IP、API、后台、账号、支付、代理等高风险域名，并输出 `websites.public.csv` 与 `bookmarks.html`。只有显式加 `--include-private` 时才导出完整 `websites.csv`。

生成物建议：

```text
exports/
  software-list.csv
  websites.csv
  bookmarks.html
  README.md
  bootstrap.windows.ps1
  bootstrap.mac.sh
  codex-setup-agent.md
  claude-setup-agent.md
```

## 脚本执行规划

Windows 入口建议：

```powershell
.\scripts\windows\bootstrap.ps1 -Mode Basic -DryRun
.\scripts\windows\bootstrap.ps1 -Mode Basic
.\scripts\windows\bootstrap.ps1 -Mode AI
.\scripts\windows\bootstrap.ps1 -Mode Full
```

模式说明：

| 模式 | 内容 |
|---|---|
| `Basic` | Chrome、VS Code、Git、PowerShell、Node、Python、常用目录 |
| `AI` | Codex、Claude、CC Switch、Cherry Studio、Trae、豆包、ComfyUI、AI 网关 |
| `Service` | New API、CLIProxyAPI、Claude Relay、FRP、NSSM、Docker |
| `Office` | 飞书、WorkBuddy、远程控制、文档工具 |
| `Full` | 全部安装，但敏感项必须人工确认 |

阶段 1 只创建了 Windows `bootstrap.ps1`，尚未创建 macOS 脚本。

## Agent 接管规划

已创建：

```text
agent-prompts/general-setup-agent.md
```

未来建议新增正式 Agent：

```text
agents/ops/computer-setup-agent/
  agent.yaml
  prompt.md
  examples.md
```

Agent 责任：

- 读取 setup kit 清单。
- 判断当前系统是 Windows 还是 macOS。
- 检查已安装软件。
- 跳过已安装项。
- 优先使用 `winget` / `brew`。
- 对 GitHub Release 类工具拉取最新版。
- 对需要登录的软件，只打开登录页并提示用户。
- 对涉及密钥的配置，只读取用户提供的安全来源，不要求用户明文粘贴。
- 生成最终安装报告 `setup-report.md`。

Agent 安全规则：

- 不读取、不打印、不保存密码、Cookie、Token、API Key、代理订阅。
- 不把浏览器历史、私有域名、内网地址发布到公开位置。
- 遇到管理员权限、系统服务注册、代理配置、付费操作、账号登录、密钥配置，必须暂停并请求用户确认。
- 不运行来源不明的安装包。
- 不删除用户文件，不重置 Git，不覆盖已有配置文件；需要覆盖时先备份并确认。

## 书签规划

当前已有：

```text
websites.csv
websites.yaml
```

下一步建议生成标准浏览器书签：

```text
exports/bookmarks.html
```

Chrome / Edge / Safari 都可以导入 HTML 书签。

不建议第一版直接写 Chrome Bookmarks 数据库，因为容易破坏浏览器数据。更稳的是：

1. 从 `websites.yaml` 生成 `bookmarks.html`。
2. 用户手动导入浏览器。
3. 或让 Agent 打开浏览器书签导入说明。

## 最新版本检查规划

当前版本字段是静态的：

```yaml
latest_known: "2026年5月6日 (v1.119.0)"
```

下一阶段可以增加自动检查：

| 来源 | 检查方式 |
|---|---|
| GitHub Release | GitHub API `/repos/:owner/:repo/releases/latest` |
| winget | `winget show <id>` |
| Homebrew | `brew info <formula>` |
| Docker 镜像 | Registry API 或手动维护 |
| 官网软件 | 暂时人工维护 |

目标命令：

```bash
npx lazy-agent-shelf setup check-updates personal-ai-workstation
```

输出：

```text
VS Code       known: 1.119.0    latest: 1.119.0
CC Switch     known: 3.13.0     latest: 3.13.1
New API       known: 1.1.138    latest: 1.1.139
Chrome        manual source     skipped
```

## 安全与分享边界

可以公开分享：

- 软件清单
- 官网链接
- 下载链接
- 安装脚本
- 目录结构
- 书签分组，需清理私人域名后
- Agent Prompt
- VS Code 插件清单
- Docker Compose 模板
- `.env.example`

不能公开分享：

- API Key
- 代理订阅
- Claude / OpenAI Token
- Cookie
- 浏览器完整历史
- 私有后台域名
- 内网地址
- 账号密码

建议后续拆分：

```text
public/
  apps.yaml
  websites.public.yaml
  scripts/
  agent-prompts/
private/
  websites.private.yaml       # gitignored
  local.env                   # gitignored
  proxy.local.yaml            # gitignored
```

`.gitignore` 建议增加：

```gitignore
**/private/*.local.*
**/private/local.env
**/private/secrets.env
**/*token*
**/*secret*
**/*cookie*
```

## 阶段规划

### 阶段 1：个人可用，当前阶段

目标：

- 有 `apps.csv` 表格兜底。
- 有 `websites.csv` 表格兜底。
- 有 `apps.yaml` / `websites.yaml` 作为结构化数据。
- 有 `kit.yaml` 作为入口。
- 有 `README.md` 说明完整方案。
- 有 `general-setup-agent.md` 可以交给 AI。
- 有基础 Windows 脚本雏形。

当前完成度：大部分完成，但 `bootstrap.ps1` 需要修复编码/解析问题。

### 阶段 2：朋友可用

目标：

- 增加 `friend-basic-setup`。
- 软件分级：必装 / 推荐 / 可选。
- 网站分组：AI / 办公 / 开发 / 交易 / 本地服务。
- 生成 `bookmarks.html`。
- 增加图文使用说明。
- 增加 macOS `bootstrap.sh` 和 `Brewfile`。

### 阶段 3：网站可展示

目标：

- Lazy Agent Shelf 网站新增 `Setup Kits` Tab。
- 每个 Kit 有独立页面。
- 软件卡片支持搜索、筛选、复制命令。
- 提供下载 CSV / 下载脚本 / 下载书签。

### 阶段 4：Agent 可接管

目标：

- 新增 `computer-setup-agent`。
- 生成 Codex / Claude / Trae 指令。
- Agent 可以检测系统、安装软件、生成报告。
- 增加安全规则：不读取密码、不打印 Token、不擅自改代理。

### 阶段 5：自动更新

目标：

- GitHub Release 自动检查。
- winget / brew 版本检查。
- 生成 `update-report.md`。
- 可选 GitHub Action 每周更新一次。

## 当前已知问题

1. `scripts/windows/bootstrap.ps1` 在 DryRun 时出现解析错误。
   - 可能原因：脚本内容包含中文字段名，在 Windows PowerShell 以非 UTF-8 方式读取后出现乱码，导致字符串截断。
   - 建议修复方式：脚本内部不要依赖中文 CSV 字段名，改为读取 `apps.yaml`，或用英文中间 CSV/JSON。
   - 也可以改为 PowerShell 7 + `#Requires -Version 7` + 确保 UTF-8 BOM，但更稳的是脚本使用英文键。
2. 当前 `websites.yaml` 可能包含私人后台或内网地址，不能直接公开。
3. 当前还没有 macOS 脚本。
4. 当前还没有生成 `bookmarks.html`。
5. 当前还没有接入网站 catalog。
6. 当前还没有 CLI `setup` 子命令。

## 下一位 Agent 建议接手顺序

1. 不要动根目录 README 和网站已有改动，那里可能由另一个对话管理。
2. 只处理 `setup-kits/personal-ai-workstation`，避免冲突。
3. 先修复 `scripts/windows/bootstrap.ps1`，确保：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\setup-kits\personal-ai-workstation\scripts\windows\bootstrap.ps1 -Mode Basic -DryRun
```

可以正常运行。

4. 建议把脚本读取源改成英文键的 `apps.yaml` 或新增 `apps.install.json`，避免中文 CSV 字段名导致 PowerShell 编码问题。
5. 生成 `exports/bookmarks.html`。
6. 新增 `scripts/mac/bootstrap.sh` 和 `scripts/mac/Brewfile`。
7. 再考虑接入网站和 CLI。

## 快速命令

查看当前文件：

```powershell
Get-ChildItem -Recurse -File "I:\Dev\通用性agent开发\setup-kits\personal-ai-workstation"
```

测试 Windows 脚本：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "I:\Dev\通用性agent开发\setup-kits\personal-ai-workstation\scripts\windows\bootstrap.ps1" -Mode Basic -DryRun
```

查看 Git 状态：

```powershell
git status --short
```

## 重要提醒

当前仓库存在其它未提交变更，这些变更不是本 setup kit 工作产生的。继续处理时请避免覆盖：

- 根目录 `README.md`
- `packages/website/src/App.jsx`
- `packages/website/src/locales/*.json`
- `packages/website/src/styles.css`
- `content/`
- `docs/navigation-taxonomy.md`
- `docs/submissions.md`
- `packages/codex-skills/`
- `schemas/content-item.schema.json`
- `agent开发需求文档/`

本次 setup kit 工作范围应限定在：

```text
setup-kits/personal-ai-workstation/
```
