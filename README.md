# CF WeChat Worker

[简体中文](./README.zh-CN.md)

Cloudflare Workers based WeChat iLink gateway with multi-account pool, routing, storage, and management APIs.

## 1. Goals

- Scan QR and bind WeChat accounts quickly.
- Manage many accounts in one control plane.
- Expose clean HTTP APIs for FastAPI (or any backend) to call.
- Keep agent side fully HTTP-based (OpenAI-compatible), no ACP/CLI subprocess dependency.

## 2. Features

- Multi-account management: create/update/list/get/delete, enable/disable, space assignment, sync reset.
- QR login workflow:
  - start session and get QR code
  - query login status
  - confirm and persist account automatically
- Multi-agent pool: weighted routing, custom endpoint/model/apiKey/headers.
- Space + per-user binding:
  - space default agent and routing strategy
  - user-level hard binding override
- Polling pipeline:
  - scheduled polling (cron)
  - manual poll trigger
  - auto disable account when `errcode=-14`
- Message handling:
  - receive text from iLink long-poll
  - call HTTP LLM endpoint
  - send text replies to WeChat
  - typing indicator support
- Inbound message panel:
  - per-account inbound storage and display
  - supports inbound text/image/file/video/voice records
  - per-account filter and clear
  - 10s auto-refresh in Web UI
- Admin UI enhancements:
  - `/admin-ui` unified control page
  - `/docs` lightweight interactive API docs
- Conversation storage:
  - per `space:user:agent` message history (trimmed)
  - list and clear APIs

## 3. Architecture

- Worker runtime:
  - `fetch`: admin/control plane API
  - `scheduled`: periodic poll loop
- KV namespace (`BOT_STATE`):
  - `account:*`
  - `agent:*`
  - `space:*`
  - `bind:*`
  - `ctx:*` (context token)
  - `contact:*` (contacts)
  - `inbox:*` (inbound messages)
  - `conv:*` (conversation history)
  - `login:*` (QR login session)

## 4. Project Structure

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

## 5. Prerequisites

- Node.js 20+
- Cloudflare account
- Wrangler CLI
- iLink-accessible network

## 6. Installation

```bash
npm install
```

## 7. Cloudflare Setup

1. Create KV namespace

```bash
wrangler kv namespace create BOT_STATE
wrangler kv namespace create BOT_STATE --preview
```

2. Fill IDs into `wrangler.toml`:

```toml
[[kv_namespaces]]
binding = "BOT_STATE"
id = "..."
preview_id = "..."
```

3. Set admin token

```bash
wrangler secret put ADMIN_TOKEN
```

4. Local run

```bash
npm run dev
```

5. Deploy

```bash
npm run deploy
```

## 8. API Overview

All `/admin/*` endpoints require:

```http
Authorization: Bearer <ADMIN_TOKEN>
Content-Type: application/json
```

### 8.1 Health

- `GET /health`

### 8.2 Overview

- `GET /admin/overview`

### 8.3 QR Login

- `POST /admin/login/start`
  - body: `{ "baseUrl?": "...", "botType?": "3", "accountIdHint?": "acc-a" }`
- `GET /admin/login/status?sessionId=...`
- `POST /admin/login/confirm`
  - body: `{ "sessionId": "...", "accountId?": "acc-a", "space?": "default" }`

### 8.4 Accounts

- `POST /admin/accounts/upsert`
- `GET /admin/accounts`
- `GET /admin/accounts/{accountId}`
- `DELETE /admin/accounts/{accountId}`
- `POST /admin/accounts/set-enabled`
- `POST /admin/accounts/set-space`
- `POST /admin/accounts/reset-sync`

### 8.5 Agents

- `POST /admin/agents/upsert`
- `GET /admin/agents`
- `GET /admin/agents/{agentId}`
- `DELETE /admin/agents/{agentId}`

### 8.6 Spaces

- `POST /admin/spaces/upsert`
- `GET /admin/spaces`
- `GET /admin/spaces/{spaceName}`
- `DELETE /admin/spaces/{spaceName}`

### 8.7 Bindings

- `POST /admin/bind/upsert`
- `GET /admin/bind/get?space=...&userId=...`
- `GET /admin/bind/list?space=...`
- `DELETE /admin/bind/remove?space=...&userId=...`

### 8.8 Conversations

- `GET /admin/conversations?space=...`
- `POST /admin/conversations/clear`

### 8.9 Polling and Send

- `POST /admin/poll` body: `{ "accountId?": "acc-a" }`
- `POST /admin/send` body: `{ "accountId": "acc-a", "to": "xxx@im.wechat", "text": "hello", "contextToken?": "..." }`

### 8.10 Gateway APIs (for your backend)

- `GET /api/accounts`
- `GET /api/contacts?accountId=...&limit=100`
- `GET /api/inbox?accountId=...&limit=100` (read inbound messages)
- `DELETE /api/inbox?accountId=...` (clear inbound for one account)
- `POST /api/send`

## 9. End-to-End Quick Flow

1. Create agent:

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

2. Create space:

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

3. QR login start:

```bash
curl -X POST "$WORKER/admin/login/start" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"baseUrl":"https://ilinkai.weixin.qq.com"}'
```

4. Poll login status and confirm:

```bash
curl -X GET "$WORKER/admin/login/status?sessionId=<SESSION_ID>" \
  -H "Authorization: Bearer $ADMIN_TOKEN"

curl -X POST "$WORKER/admin/login/confirm" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"<SESSION_ID>","accountId":"acc-a","space":"default"}'
```

5. Trigger poll:

```bash
curl -X POST "$WORKER/admin/poll" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

## 10. FastAPI Integration Pattern

Recommended split:

- Workers: WeChat channel gateway and control plane.
- FastAPI: business orchestration, user auth, audit, multi-tenant rules.

## 11. FAQ

- If `/api/send` returns success but no message appears on WeChat:
  - Send one message from WeChat to that bot first (to activate session/context).
  - Retry `/api/send`.

FastAPI should call Worker APIs with server-to-server token and keep client apps away from direct Worker admin access.

## 12. Production Notes

- KV is eventually consistent. For strict consistency and poll-locking, migrate control state to D1 and account poll locks to Durable Objects.
- Keep API keys out of KV for production (use secret manager).
- Add request signing/IP allowlist/rate limit for admin endpoints.
- Consider splitting into two Workers at scale:
  - ingress poller
  - async queue consumer

## 13. Compliance Boundary

Use only authorized own accounts and compliant platform workflows. This project provides integration and management infrastructure, not bypass tooling.

## 14. License

MIT

## 15. Web UI

After deployment, open:

- `https://<your-worker-domain>/admin-ui`
- `https://<your-worker-domain>/docs`

Notes:

- Enter `ADMIN_TOKEN` in `/admin-ui` to use QR onboarding, account management, send test, manual poll, and inbound message viewer.
- Inbound panel supports per-account filter and 10-second auto-refresh.
