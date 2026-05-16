# N6 上线工作清单(给你 / 中心维护者)

2026-05-16 起。N6 是第一个落地家庭节点,会暴露所有 bug,后面 N7-N16 才能照搬。
预计跨度:1-2 个工作日(主要看家庭网络和首尔配合速度)。

---

## A. 上线前:中心侧准备(0.5 天)

### A1. 首尔 frps 这边核对
- [ ] SSH 到 `Administrator@150.109.233.152`
- [ ] 看 `frps.toml`:`bindPort=7000`、`auth.token` 跟 `FRP/frpc节点配置指南含密码.md` 第 191 行一致
- [ ] `allowPorts` 配置必须包含 `16006-16200/tcp`(N6-N16 + buffer)
- [ ] 腾讯云**安全组**入站规则放行 `16006-16200/tcp`(否则首尔本机能 curl,外网不能 —— 但 NewAPI 也是首尔本机调,所以这步即使不放行也能跑 NewAPI,**仅在需要节点直接对外暴露时才必须**)
- [ ] `systemctl status frps` 或 NSSM 服务正常 Running
- [ ] `ss -ltnp | grep :7000` 有 LISTENING

### A2. 飞书机器人
- [ ] 在飞书群拉个机器人,拿到 webhook URL + secret(签名)
- [ ] 给这个 webhook **加签**(更安全),或者放飞群"仅签名校验"开关
- [ ] 测发一条消息验证(可用 curl 直接 POST)

### A3. 域名 `flaios.com`(可选,不阻塞 N6 上线)
- [ ] 在域名商加 `api6.flaios.com` A 记录或 CNAME 占位(指 frps 公网 IP 也行,后续接 Caddy 反代时再调)
- [ ] **不做也行**:NewAPI 直接走 `http://127.0.0.1:16006`,不需要这个域名;`api6.flaios.com` 是给"未来想直接对外暴露 N6"时用的

### A4. 准备 release bundle(给 N6)

你这台 dev 机上:
- [x] ~~`git init` + 首次 commit~~ —— 2026-05-16 完成,42 文件
- [x] ~~创建 `ElevenZhou/crs2-deploy`(private)~~ —— https://github.com/ElevenZhou/crs2-deploy 已推
- [x] ~~跑 `scripts/fetch-core.ps1`~~ —— 2026-05-16,vendor/CRS2.0 @ v0.1.126-baseline
- [x] ~~跑 `scripts/build-release.ps1`~~ —— 2026-05-16
- [x] ~~产出 release zip~~ —— `release/crs2-bundle-v0.1.0-core-v0.1.126-baseline.zip` 629 MB,SHA256 `6C2C21E2...DCCA`,2179 文件

> ⚠️ Docker Desktop 装包占 ~620MB,bundle zip 会很大。如果 N6 网络好可以让它自己 `download-all.ps1` 联网拉,bundle 体积就降到 ~50MB。看情况选。

---

## B. N6 节点机器(0.5-1 天,跟节点同学协作)

### B1. 渠道选一种
- **U 盘 / IM 文件**:把 `crs2-bundle-v0.1.0-*.zip` 拷给 N6 节点
- **GitHub clone**:让节点跑 `git clone https://github.com/ElevenZhou/crs2-deploy.git C:\projects\crs2-deploy` 后再下载实物

### B2. 节点同学要做的事

直接把 `DOC/节点部署SOP.md` 整份发给他;或者更省心 —— 把 `Other/AI自动化部署的提示词.md` 整段给他,让他喂给本机的 Claude/Cursor 自动跑。

如果他选 AI 自动化路线:
- [ ] 把提示词里 `N{X}` 全部替换成 `N6`
- [ ] `16{0XX}` → `16006`
- [ ] `api{X}` → `api6`
- [ ] `{LARK_URL}` / `{LARK_SECRET}` → 真实值
- [ ] 喂给 AI

### B3. 你需要在飞书等的信号
- [ ] 飞书群"🆗 节点部署完成 — N6"绿卡 → 部署成功
- [ ] 节点同学发节点机器上 `OPS\status.ps1` 截图 → 双确认

如果**两小时**还没看到任何上报,主动 IM 问情况。

---

## C. 首尔接入(几分钟)

N6 上报完成后:

### C1. 验证 frp 隧道
- [ ] 首尔本机: `curl -i http://127.0.0.1:16006/health` → 期望 200
- [ ] 若失败,看 N6 节点的 `logs\frpc.err.log`,90% 是 token 错或 remotePort 冲突

### C2. 在 N6 节点上建 NewAPI 专用 key
- [ ] N6 节点同学在他本机 `http://127.0.0.1:8080/admin`(或 sub2api admin URL)登录
- [ ] 新建用户 `newapi-relay`(或类似),生成一把 API key
- [ ] 用 1Password / IM 把 key **加密**回传给你
- [ ] 你在 `central/节点部署总表.md` 或飞书 Base 记一笔(N6 / key 指纹 / 启用时间)

### C3. 在首尔 NewAPI 加 channel

按 `central/NewAPI接入指南.md` §3.2 填一遍:
- 名称: `N6-api6-sub2api`
- 类型: Anthropic
- Base URL: `http://127.0.0.1:16006`
- 密钥: B3 拿到的 key
- 模型: 跟 N6 同学确认 sub2api 那边开了哪些
- 分组: `home-nodes`

点测试 → 200 → 保存 → 给 channel 加到默认分组的负载池里。

### C4. 端到端 smoke test
- [ ] 用一个测试用户的 NewAPI key,发一条 ping 请求(curl 或 Postman)
- [ ] NewAPI 后台"日志"页能看到这条请求被路由到 `N6-api6-sub2api` channel
- [ ] sub2api admin 那边也能看到这条调用

通了 = N6 真正上线。

---

## D. 收尾(0.5 天)

### D1. 更新中心文档
- [ ] `central/节点部署总表.md` 填上 N6 的真实信息(主人、机器主机名、上线日期、key 指纹、ISP)
- [ ] 这个清单(`N6上线工作清单.md`)写一段"复盘"—— 哪步卡了多久、什么 bug、N7 怎么避免

### D2. 把 N6 上线时改的所有脚本/文档 commit 到 crs2-deploy 仓
- [ ] `git status` 看一遍
- [ ] 修过的东西分别 commit(token 别 commit、secrets 别 commit、release zip 别 commit)
- [ ] `git push`

### D3. 复制 N6 经验做 N7 的模板
- [ ] 写一个 `central/N7-N16批量上线清单.md`(基本是这份的简化版,假设 SOP 已经稳)
- [ ] 排期 —— 一周做完 5 个,还是一个月做完 11 个

---

## 风险点 / 我担心会卡的地方

| 风险 | 影响 | 应对 |
|---|---|---|
| 家庭网络不稳定,frpc 频繁掉线 | NewAPI channel 抖动,用户感受到 504 | 监控里降阈值,告警冷却调大;或加 frpc 心跳 + 自动重连参数 |
| Docker Desktop 在某些家庭 Win 上装不顺(老 BIOS / 关闭虚拟化) | 部署卡死 | 提前让节点同学开 BIOS 虚拟化 + Hyper-V;不行就改 docker-rootless 或单机 PostgreSQL 直装 |
| sub2api 镜像 `weishaw/sub2api:latest` 下载慢 / DockerHub 限速 | 部署慢 | 改用国内镜像源(阿里云/腾讯云 mirror) |
| 11 个节点 key 管理混乱 | 出事不知道是谁的 key | 节点部署总表强制记 key 指纹(SHA256 前 8 位),不存原 key |
| 中心 fork 的 crs2-core 上游有 breaking change | 升级时 NewAPI 调度全炸 | 始终 canary 一个节点先验,通过再批量;每次升级都 git tag + CORE_VERSION 锁版本 |
