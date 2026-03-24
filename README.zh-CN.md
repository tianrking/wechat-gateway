# CF WeChat Worker

[English](./README.md)

基于 Cloudflare Workers 的微信 iLink 网关，支持多账号池、路由分发、状态存储与管理接口。

## 1. 目标

- 扫码后快速绑定微信账号。
- 在一个控制面管理大量账号。
- 对外暴露清晰 HTTP API，供 FastAPI（或任意后端）调用。
- Agent 侧完全走 HTTP（OpenAI 兼容），不依赖 ACP/CLI 子进程。

## 2. 功能

- 多账号管理：新增/更新/列表/查询/删除、启停、空间切换、同步游标重置。
- 扫码登录流程：
  - 创建扫码会话并返回二维码
  - 查询扫码状态
  - 确认后自动落库账号
- 多 Agent 池：权重路由，自定义 endpoint/model/apiKey/headers。
- 空间与用户绑定：
  - 空间默认 Agent 与分发策略
  - 用户级强绑定覆盖默认策略
- 轮询处理：
  - cron 定时轮询
  - 手动触发轮询
  - `errcode=-14` 自动停用账号
- 消息处理：
  - iLink 长轮询收消息
  - 调用 HTTP 大模型
  - 回发微信文本
  - typing 状态支持
- 入站消息面板：
  - 按账号存储与展示入站消息
  - 支持按账号筛选与清空
  - 支持每 10 秒自动刷新
- 管理界面增强：
  - `/admin-ui` 统一管理页面
  - `/docs` 轻量接口文档页面（可展开查看示例）
- 会话存储：
  - 按 `space:user:agent` 保存历史（自动裁剪）
  - 提供查询与清理接口

## 3. 架构

- Worker 运行时：
  - `fetch`：管理/控制平面 API
  - `scheduled`：周期轮询
- KV 命名空间（`BOT_STATE`）：
  - `account:*`
  - `agent:*`
  - `space:*`
  - `bind:*`
  - `ctx:*`（context token）
  - `contact:*`（联系人）
  - `inbox:*`（入站消息）
  - `conv:*`（会话历史）
  - `login:*`（扫码会话）

## 4. 项目结构

```text
src/
  constants.js
  index.js
  routes/
    admin.js
    api.js
    docs.js
    ui.js
  services/
    agent.js
    ilink.js
    poller.js
    router.js
  store/
    kv.js
    accounts.js
    agents.js
    spaces.js
    bindings.js
    conversations.js
    inbox.js
    logins.js
  utils/
    auth.js
    common.js
```

## 5. 环境要求

- Node.js 20+
- Cloudflare 账号
- Wrangler CLI
- 可访问 iLink API 的网络环境

## 6. 安装

```bash
npm install
```

## 7. Cloudflare 配置

1. 创建 KV

```bash
wrangler kv namespace create BOT_STATE
wrangler kv namespace create BOT_STATE --preview
```

2. 将 ID 写入 `wrangler.toml`

```toml
[[kv_namespaces]]
binding = "BOT_STATE"
id = "..."
preview_id = "..."
```

3. 设置管理口令

```bash
wrangler secret put ADMIN_TOKEN
```

4. 本地运行

```bash
npm run dev
```

5. 部署

```bash
npm run deploy
```

## 8. API 总览

所有 `/admin/*` 接口都需要：

```http
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

### 8.1 健康检查

- `GET /health`

### 8.2 概览

- `GET /admin/overview`

### 8.3 扫码登录

- `POST /admin/login/start`
  - body：`{ "baseUrl?": "...", "botType?": "3", "accountIdHint?": "acc-a" }`
- `GET /admin/login/status?sessionId=...`
- `POST /admin/login/confirm`
  - body：`{ "sessionId": "...", "accountId?": "acc-a", "space?": "default" }`

### 8.4 账号

- `POST /admin/accounts/upsert`
- `GET /admin/accounts`
- `GET /admin/accounts/{accountId}`
- `DELETE /admin/accounts/{accountId}`
- `POST /admin/accounts/set-enabled`
- `POST /admin/accounts/set-space`
- `POST /admin/accounts/reset-sync`

### 8.5 Agent

- `POST /admin/agents/upsert`
- `GET /admin/agents`
- `GET /admin/agents/{agentId}`
- `DELETE /admin/agents/{agentId}`

### 8.6 空间

- `POST /admin/spaces/upsert`
- `GET /admin/spaces`
- `GET /admin/spaces/{spaceName}`
- `DELETE /admin/spaces/{spaceName}`

### 8.7 绑定

- `POST /admin/bind/upsert`
- `GET /admin/bind/get?space=...&userId=...`
- `GET /admin/bind/list?space=...`
- `DELETE /admin/bind/remove?space=...&userId=...`

### 8.8 会话

- `GET /admin/conversations?space=...`
- `POST /admin/conversations/clear`

### 8.9 轮询与主动发送

- `POST /admin/poll` body：`{ "accountId?": "acc-a" }`
- `POST /admin/send` body：`{ "accountId": "acc-a", "to": "xxx@im.wechat", "text": "hello", "contextToken?": "..." }`

### 8.10 网关 API（给业务后端）

- `GET /api/accounts`
- `GET /api/contacts?accountId=...&limit=100`
- `GET /api/inbox?accountId=...&limit=100`（读取入站消息）
- `DELETE /api/inbox?accountId=...`（清空某账户入站消息）
- `POST /api/send`

## 9. 快速全链路

1. 创建 Agent：

```bash
curl -X POST "$WORKER/admin/agents/upsert" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "openai-main",
    "endpoint": "https://api.openai.com/v1/chat/completions",
    "model": "gpt-5",
    "apiKey": "YOUR_API_KEY",
    "weight": 1,
    "enabled": true
  }'
```

2. 创建空间：

```bash
curl -X POST "$WORKER/admin/spaces/upsert" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "default",
    "defaultAgentId": "openai-main",
    "strategy": "sticky_weighted"
  }'
```

3. 发起扫码：

```bash
curl -X POST "$WORKER/admin/login/start" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"https://ilinkai.weixin.qq.com"}'
```

4. 查询状态并确认入库：

```bash
curl -X GET "$WORKER/admin/login/status?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$WORKER/admin/login/confirm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<SESSION_ID>","accountId":"acc-a","space":"default"}'
```

5. 触发轮询：

```bash
curl -X POST "$WORKER/admin/poll" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 10. FastAPI 对接建议

推荐分层：

- Workers：微信通道网关 + 控制平面。
- FastAPI：业务编排、用户鉴权、审计、多租户策略。

## 11. 常见问题

- 如果 `/api/send` 返回成功但微信端未看到消息：
  - 先在微信里给该机器人发送一条消息，触发会话上下文。
  - 再次调用 `/api/send` 进行重试。

FastAPI 通过服务端调用 Worker API，不建议客户端直接访问 Worker 管理接口。

## 12. 生产建议

- KV 为最终一致；若需要强一致和账号轮询锁，建议将控制数据迁移到 D1，并用 Durable Objects 做账号级轮询锁。
- 生产环境不要把模型 API key 长期明文放 KV，建议接入密钥管理服务。
- 管理接口建议增加签名校验/IP 白名单/限流。
- 流量提升后可拆分为两个 Worker：
  - ingress poller
  - async queue consumer

## 13. 合规边界

仅在账号授权与平台规范范围内使用。本项目提供的是接入与管理基础设施，不提供规避机制工具。

## 14. 许可证

MIT

## 15. Web 管理界面

部署完成后可直接访问：

- `https://<你的worker域名>/admin-ui`
- `https://<你的worker域名>/docs`

说明：

- 在 `/admin-ui` 中输入 `ADMIN_TOKEN` 后可在线完成扫码登录、账号管理、发送测试、手动轮询、入站消息查看。
- 入站消息支持按账号筛选，支持每 10 秒自动刷新。
