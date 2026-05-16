# N6 部署执行步骤(RDP 实操,git clone 路线)

操作者:**你**(从本机 RDP 进 N6,以 **ElevenZhou** 身份操作)
预计耗时:**60 分钟**,大头是 Docker Desktop 装包 + 重启 + 首次 `docker compose pull`
首次部署的"小白鼠",踩坑全部反哺到 N7-N16 SOP。

> 凭据 / 配置默认值已经全部内置在仓库里(飞书 webhook 预填、frp token 明文模板),
> 节点同学只需要 `gh auth login` 一次和确认机器编号,其他全自动。

---

## 阶段 P:先在你这台本机做(2 分钟)

### P1. 把当前修改推到 GitHub

```powershell
cd I:\Dev\CRS2.0配套
git status
# 如果干净,跳过下一行
git add . && git commit -m "..." && git push
```
确保 `https://github.com/ElevenZhou/crs2-deploy` 是最新的(包含 webhook 预填后的 secrets.local.env.example、本 SOP 最新版)。

---

## 阶段 A:N6 机器先决条件(10 分钟)

> 以下命令全部在 **N6 的 RDP 桌面打开管理员 PowerShell** 里执行
> (右键开始菜单 → 终端管理员;或 `Win+X` → A)

### A1. 装 git / gh / PowerShell 7(任意一个已有就跳过)

```powershell
winget install --id Git.Git              -e --silent --accept-source-agreements --accept-package-agreements
winget install --id GitHub.cli           -e --silent --accept-source-agreements --accept-package-agreements
winget install --id Microsoft.PowerShell -e --silent --accept-source-agreements --accept-package-agreements
```

**关闭当前 PowerShell 窗口,开一个新的管理员 PowerShell**(让 PATH 刷新),然后:

```powershell
git --version       # 应是 2.x
gh --version        # 应是 2.x
pwsh --version      # 应是 7.x
```

### A2. BIOS 虚拟化(N6 同学协助检查 —— **能不能远程做这步是 N6 部署成败的关键**)

```powershell
# 看 CPU 是否报告虚拟化已启用
Get-ComputerInfo -Property "HyperVisorPresent","HyperVRequirementVirtualizationFirmwareEnabled" | Format-List
```

- `HyperVRequirementVirtualizationFirmwareEnabled = True` → BIOS 已开 VT-x / AMD-V,继续
- `False` → **需要现场重启进 BIOS 开虚拟化**,这一步远程不能做,先停下,联系 N6 同学

### A3. 启用 Hyper-V + WSL(可能要重启)

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Hyper-V -All -NoRestart
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform -NoRestart
wsl --install --no-distribution
```

如果提示"需要重启",**先重启 N6**(`Restart-Computer -Force`),RDP 重连后再继续。

---

## 阶段 B:把代码 + 实物搞到 N6(5-30 分钟)

**两条路线二选一**。优先 B-1(git clone),网络受限时改 B-2(zip)。

```
┌─ B-1 git clone(推荐)
│   - 优点:节点自助、后续 git pull 升级、少传 600MB 大文件
│   - 前提:N6 能访问 GitHub(可能需要梯子)+ 你的 ElevenZhou 账号可登
│   - 网络:vendor ~50MB(GitHub)+ 安装包 ~632MB(各官方源:Docker/nssm.cc/GitHub-frp)
│
└─ B-2 release zip(备选)
    - 优点:一次拷贝,不依赖 N6 直连 GitHub / Docker / nssm
    - 缺点:本机→N6 要传 629MB,后续升级也得重新打 zip
    - 适用:N6 在公司内网 / GitHub 完全访问不了 / 你想离线交付
```

---

### 路线 B-1:git clone(推荐)

#### B1-1. GitHub 身份(用你 ElevenZhou 账号)

```powershell
gh auth login
```
交互回答:
- Where to log in? → **GitHub.com**
- Preferred protocol? → **HTTPS**
- Authenticate Git? → **Yes**
- How? → **Login with a web browser**
- 它会显示一个 **one-time code**,记下来
- 它会自动打开 N6 上的浏览器到 `https://github.com/login/device`
- 用 ElevenZhou 账号登录 GitHub(如果没登,先登)
- 粘贴 code,授权,完成

```powershell
gh auth status   # 应显示 Logged in to github.com as ElevenZhou
```

#### B1-2. 克隆 crs2-deploy

```powershell
# 路径必须是 C:\projects\crs2-deploy(install.ps1 假设)
New-Item -ItemType Directory -Force -Path C:\projects | Out-Null
Set-Location C:\projects
gh repo clone ElevenZhou/crs2-deploy crs2-deploy
Set-Location .\crs2-deploy
Test-Path .\install.ps1     # True
```

#### B1-3. 拉 vendor(sub2api 源码)

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\scripts\fetch-core.ps1
# 大约 50-80 MB,几分钟
Test-Path .\vendor\CRS2.0\deploy\docker-compose.yml    # True
```

#### B1-4. 拉环境必备安装包(Docker Desktop / NSSM / frpc)

```powershell
pwsh -NoProfile -ExecutionPolicy Bypass -File .\Other\环境必备安装包\download-all.ps1
# 共 ~632 MB,主要是 Docker Desktop 620 MB,跑几分钟
# 完成后哈希自动校验
```

下载失败处理:
- Docker Desktop 断点续传不支持,失败重跑 `download-all.ps1`(它会跳过哈希对的,只重下失败的)
- 网络太慢:**回头改走 B-2**

完成后跳到 **阶段 C**。

---

### 路线 B-2:release zip(备选,离线 / 网络差时用)

#### B2-1. 在你本机准备 zip(如果还没有)

```powershell
# 你的本机
cd I:\Dev\CRS2.0配套
.\scripts\fetch-core.ps1
.\Other\环境必备安装包\download-all.ps1      # 确保 NSSM/frpc/Docker 实物齐
pwsh -File .\scripts\build-release.ps1 -DeployVersion v0.1.0 -CoreVersion v0.1.126-baseline
# 产出 release\crs2-bundle-v0.1.0-core-v0.1.126-baseline.zip (629MB) + .sha256
```

#### B2-2. 把 zip 送到 N6,挑一种

| 方式 | 描述 |
|---|---|
| **RDP 驱动器重定向**(推荐) | mstsc 未连接前 → 选项 → 本地资源 → 详细信息 → 驱动器 → 勾你 zip 所在盘 → 连接;N6 上"此电脑"看到映射盘 → 拖 zip 到 N6 `C:\projects\` |
| 微云 / 阿里盘 / WeChat 文件传输 | 上传 zip,N6 下载 |
| OSS 临时直链 | 腾讯 COS / 阿里 OSS,N6 上 `Invoke-WebRequest` 拉 |

#### B2-3. 验证传输完整性(传完都要做)

```powershell
# N6 PowerShell
Set-Location C:\projects
(Get-FileHash crs2-bundle-v0.1.0-core-v0.1.126-baseline.zip -Algorithm SHA256).Hash
```

对比本机 `.sha256` 文件值(忽略大小写)。**不一致就重传,不要将就。**

当前 v0.1.0 的 SHA256:`6C2C21E2BA8B51CBD65FB825CFC360776A21C153261E66528F3D1458E6E1DCCA`

#### B2-4. 解压

```powershell
Set-Location C:\projects
Expand-Archive .\crs2-bundle-v0.1.0-core-v0.1.126-baseline.zip -DestinationPath .\crs2-deploy
Set-Location .\crs2-deploy

# 验证齐全
Test-Path .\install.ps1                                                  # True
Test-Path .\vendor\CRS2.0\deploy\docker-compose.yml                      # True
Test-Path .\Other\环境必备安装包\docker-desktop-installer.exe            # True
Test-Path .\Other\环境必备安装包\nssm-2.24.zip                           # True
Test-Path .\Other\环境必备安装包\frp_0.68.1_windows_amd64.zip            # True
```

#### B2-5. 验证安装包实物哈希

```powershell
pwsh -File .\Other\环境必备安装包\download-all.ps1 -VerifyOnly
```
期望三个 `[OK]`,没有 `[BAD HASH]`。

完成后进 **阶段 C**。

---

## 阶段 C:解压 NSSM + frpc(2 分钟)

```powershell
Set-Location C:\projects\crs2-deploy

# NSSM
Expand-Archive .\Other\环境必备安装包\nssm-2.24.zip -DestinationPath .\NSSM-tmp -Force
Move-Item .\NSSM-tmp\nssm-2.24\win64\nssm.exe .\NSSM\nssm.exe -Force
Remove-Item -Recurse -Force .\NSSM-tmp
.\NSSM\nssm.exe version       # 应输出 2.24

# frpc
Expand-Archive .\Other\环境必备安装包\frp_0.68.1_windows_amd64.zip -DestinationPath .\FRP-tmp -Force
Move-Item .\FRP-tmp\frp_0.68.1_windows_amd64\frpc.exe .\FRP\frpc.exe -Force
Remove-Item -Recurse -Force .\FRP-tmp
.\FRP\frpc.exe --version      # 应输出 0.68.1
```

---

## 阶段 D:装 Docker Desktop(20-30 分钟,含重启)

### D1. 静默安装

```powershell
Set-Location C:\projects\crs2-deploy
Start-Process -FilePath .\Other\环境必备安装包\docker-desktop-installer.exe `
  -ArgumentList 'install', '--quiet', '--accept-license' `
  -Wait -NoNewWindow
```
5-10 分钟。装完会提示需要重启 Windows。

### D2. 重启

```powershell
Restart-Computer -Force
```
重启后 RDP 重连。

### D3. 首次启动 Docker Desktop GUI

- 开始菜单 → **Docker Desktop**(双击启动,**必须先点过一次 GUI**)
- 接受协议(如有)
- 等左下角变绿 "Engine running"(首次 1-2 分钟)
- 设置 → General → 勾 "**Start Docker Desktop when you sign in to your computer**"
- 关闭 Docker Desktop 窗口(后台继续跑)

### D4. (可选)国内镜像加速,DockerHub 慢的话才做

- Docker Desktop → Settings → Docker Engine
- 在 JSON 里加:
  ```json
  "registry-mirrors": [
    "https://docker.mirrors.ustc.edu.cn",
    "https://hub-mirror.c.163.com"
  ]
  ```
- Apply & Restart

### D5. 验证 Docker

打开**新的**管理员 PowerShell:
```powershell
docker version       # client + server 都有版本
docker info          # 没报错
docker ps            # 空列表
```

---

## 阶段 E:写 secrets.local.env(1 分钟)

```powershell
Set-Location C:\projects\crs2-deploy
Copy-Item .\secrets.local.env.example .\secrets.local.env
# 默认值已经预填了统一飞书 webhook,不需要编辑,直接进下一步
```

如果你想用别的飞书机器人,这时 `notepad .\secrets.local.env` 改 `LARK_WEBHOOK` 那一行。一般 **N6+ 全部用预填的统一 webhook**,不需要改。

---

## 阶段 F:一键部署(5-15 分钟)

```powershell
Set-Location C:\projects\crs2-deploy
pwsh -NoProfile -ExecutionPolicy Bypass -File .\install.ps1 -NodeId N6
```

逐步观察:

1. `=== 0. 加载节点配置 (NodeId=N6) ===` 必须看到 `frpc_remote_port = 16006 (proxy: n6-sub2api)`
2. `=== 1. 检查 & 安装环境依赖 ===` 跳过(我们已经手工装好了)
3. `=== 2. 准备 CRS2.0 本体 ===` vendor 已就位,跳过
4. `=== 3. 配置 FRP 客户端 ===` 渲染 `FRP\frpc.toml`
5. `=== 3.5 渲染 OPS runtime-config ===` 渲染 `OPS\runtime-config.ps1`
6. `=== 4. 注册 Windows 服务(NSSM) ===` 注册 `sub2api` + `frpc` 两个服务
7. `=== 5. 启服务 + 监控 ===` 启动两服务 + 注册每分钟跑的健康监控计划任务
   - **这一步首次会触发 `docker compose pull weishaw/sub2api:latest`,3-5 分钟**
8. `=== 6. 上报部署完成 ===` 飞书发"🆗 节点部署完成 — N6"绿卡 + 本地落档

期望最后:
```
>>> 节点 N6 部署完成 <<<
```

中途任何 throw → 完整输出截图给我们定位。

---

## 阶段 G:在 N6 上验证(3 分钟)

```powershell
Set-Location C:\projects\crs2-deploy
pwsh -NoProfile -ExecutionPolicy Bypass -File .\OPS\status.ps1
```

期望:
- `sub2api` = Running(绿)
- `frpc` = Running(绿)
- CRS 端口 8080 LISTENING
- HTTP 200 from `http://127.0.0.1:8080/health`

```powershell
Get-Content .\logs\frpc.out.log -Tail 30
```
必须看到:
- `login to server success`
- `[n6-sub2api] start proxy success`

如果 status 全绿但 health 不通 → `docker compose -f .\vendor\CRS2.0\deploy\docker-compose.yml ps`(应该看到 sub2api / sub2api-postgres / sub2api-redis 都 Up)。

---

## 阶段 H:首尔侧验证(2 分钟,你在你本机做)

```bash
# 你的本机(不在 N6,在你办公主机)
ssh -i "Y:/服务器管理/腾讯云-首尔-Ubunut-150.109.233.152/ShouerUbunutNewapi.pem" \
    ubuntu@150.109.233.152 \
    "sudo ss -ltn | grep 16006 && curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:16006/health"
```

期望:
- `ss` 输出有 `LISTEN 0 4096 *:16006`
- curl 返回 **200**

如果 502 / connect refused → 看 N6 上 `logs\frpc.err.log` 末 30 行。

---

## 阶段 I:接 NewAPI(15 分钟,见 `NewAPI接入指南.md`)

简版:

### I.1 N6 上建 sub2api 专用 key
- N6 浏览器:`http://127.0.0.1:8080`
- 首次登录账密:`docker logs sub2api 2>&1 | Select-String -Pattern "admin"`(找 AUTO_SETUP 输出的初始账密)
- 用户管理 → 新建 `newapi-relay` → 模型权限按需开 → 生成 API key → 复制
- 在记事本临时存一下(后面要喂 NewAPI)

### I.2 首尔 NewAPI 后台
- 浏览器打开 NewAPI 后台(账密在 `Y:\服务器管理\...\NewAPI部署账号密码.local.txt`)
- 渠道 → 添加:
  - 名称 `N6-api6-sub2api`
  - 类型 Anthropic
  - Base URL `http://127.0.0.1:16006`
  - 密钥 = I.1 的 key
  - 模型 = N6 sub2api 那边开了什么填什么
  - 分组 `home-nodes`
  - 自动禁用 开
- 点测试 → 200
- 保存

### I.3 端到端 smoke test
- 用 NewAPI 测试 token 发一条 ping
- NewAPI 日志页能看到路由到 `N6-api6-sub2api`
- sub2api admin → API 调用日志 能看到

---

## 阶段 J:收尾(5 分钟)

### J.1 在 N6 本机
```powershell
# 看运行状态总览
pwsh -File C:\projects\crs2-deploy\OPS\status.ps1

# 如果开机后想自动起,确认 NSSM 服务 startup type
.\NSSM\nssm.exe get sub2api Start    # SERVICE_AUTO_START
.\NSSM\nssm.exe get frpc Start       # SERVICE_AUTO_START
```

### J.2 你本机
- `central/节点部署总表.md` 加一行(主人 / 机器主机名 / 部署日期 / sub2api key 指纹前 8 位 / ISP)
- `git add . && git commit -m "docs: N6 上线记录" && git push`
- (可选)在 GitHub 给本次 commit 打个 tag `node-N6-deployed`

### J.3 让 N6 同学知道
- 他不需要做后续操作 —— 后台一切自动
- 但要提醒他:**机器别关机/睡眠**,关了节点就掉 frp,飞书会报警
- 如果家里要停电或换机,提前告诉你

---

## 出问题速查表

| 症状 | 第一步 |
|---|---|
| BIOS 虚拟化关 | 联系现场,远程做不了 |
| `winget install` 找不到包 | Win11 23H2+ 内建,旧版要 `Install-Module Microsoft.WinGet.Client` 或下载 winget MSIX |
| gh auth login 浏览器没自动开 | 手动浏览器开 `https://github.com/login/device` 粘 code |
| `gh repo clone` 401/403 | gh auth 没绑对账号,`gh auth status` 看是不是 ElevenZhou |
| `fetch-core.ps1` 卡在 git clone | GitHub 网络慢,挂代理或重试 |
| Docker Desktop 卡 starting | `wsl --update`;Docker Desktop → Troubleshoot → Reset to factory defaults |
| `docker compose pull` 超时 | 看 §D4 配国内镜像 |
| install.ps1 中途崩 | 整段输出截图,贴飞书 @你 |
| 服务 Running 但 health 不通 | `docker compose -f vendor\CRS2.0\deploy\docker-compose.yml logs --tail 50` |
| frpc auth fail | `FRP\frpc.toml` 第 12 行 token 跟 `FRP\frpc节点配置指南含密码.md` 第 191 行比对 |
| frpc port already used | 首尔已经有人占了 16006(让我检查 frps 日志) |
| 飞书没收到卡片 | `.\OPS\feishu\config.ps1` 加载值是不是空了;`Get-Content secrets.local.env` 看 webhook 完整 |

---

## 完成标志(5 全勾 = N6 真上线)

- [ ] `OPS\status.ps1` 全绿
- [ ] 首尔 SSH 验 `http://127.0.0.1:16006/health` → 200
- [ ] 飞书"🆗 节点部署完成 — N6"卡片到了
- [ ] NewAPI `N6-api6-sub2api` channel 测试通过
- [ ] smoke test 走通(NewAPI → N6 → sub2api → 返 200)
