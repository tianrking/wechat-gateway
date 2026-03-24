function esc(v) {
  return String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function endpoint(method, path, opts = {}) {
  return {
    method,
    path,
    auth: opts.auth !== false,
    summary: opts.summary || "",
    query: opts.query || "",
    body: opts.body || "",
  };
}

const groups = [
  {
    name: "Public",
    items: [
      endpoint("GET", "/health", {
        auth: false,
        summary: "Health check",
      }),
      endpoint("GET", "/"),
      endpoint("GET", "/admin-ui"),
      endpoint("GET", "/docs", {
        auth: false,
        summary: "This API docs page",
      }),
    ],
  },
  {
    name: "Admin Overview + Login",
    items: [
      endpoint("GET", "/admin/overview"),
      endpoint("POST", "/admin/login/start", {
        body: '{ "baseUrl": "https://ilinkai.weixin.qq.com", "botType": "3", "accountIdHint": "acc-a" }',
      }),
      endpoint("GET", "/admin/login/status", {
        query: "sessionId=<SESSION_ID>",
      }),
      endpoint("POST", "/admin/login/confirm", {
        body: '{ "sessionId": "<SESSION_ID>", "accountId": "acc-a", "space": "default" }',
      }),
    ],
  },
  {
    name: "Admin Accounts",
    items: [
      endpoint("POST", "/admin/accounts/upsert", {
        body: '{ "accountId":"acc-a","botToken":"...","botId":"...@im.bot","baseUrl":"https://ilinkai.weixin.qq.com","space":"default","enabled":true }',
      }),
      endpoint("GET", "/admin/accounts"),
      endpoint("GET", "/admin/accounts/{accountId}"),
      endpoint("DELETE", "/admin/accounts/{accountId}"),
      endpoint("POST", "/admin/accounts/set-enabled", {
        body: '{ "accountId":"acc-a","enabled":true }',
      }),
      endpoint("POST", "/admin/accounts/set-space", {
        body: '{ "accountId":"acc-a","space":"default" }',
      }),
      endpoint("POST", "/admin/accounts/reset-sync", {
        body: '{ "accountId":"acc-a" }',
      }),
    ],
  },
  {
    name: "Admin Agents / Spaces / Bindings",
    items: [
      endpoint("POST", "/admin/agents/upsert", {
        body: '{ "id":"openai-main","endpoint":"https://api.openai.com/v1/chat/completions","model":"gpt-5","apiKey":"...","enabled":true,"weight":1 }',
      }),
      endpoint("GET", "/admin/agents"),
      endpoint("GET", "/admin/agents/{agentId}"),
      endpoint("DELETE", "/admin/agents/{agentId}"),
      endpoint("POST", "/admin/spaces/upsert", {
        body: '{ "name":"default","defaultAgentId":"openai-main","strategy":"sticky_weighted" }',
      }),
      endpoint("GET", "/admin/spaces"),
      endpoint("GET", "/admin/spaces/{spaceName}"),
      endpoint("DELETE", "/admin/spaces/{spaceName}"),
      endpoint("POST", "/admin/bind/upsert", {
        body: '{ "space":"default","userId":"xxx@im.wechat","agentId":"openai-main" }',
      }),
      endpoint("GET", "/admin/bind/get", {
        query: "space=default&userId=xxx@im.wechat",
      }),
      endpoint("GET", "/admin/bind/list", {
        query: "space=default",
      }),
      endpoint("DELETE", "/admin/bind/remove", {
        query: "space=default&userId=xxx@im.wechat",
      }),
    ],
  },
  {
    name: "Admin Runtime",
    items: [
      endpoint("GET", "/admin/conversations", {
        query: "space=default",
      }),
      endpoint("POST", "/admin/conversations/clear", {
        body: '{ "space":"default","userId":"xxx@im.wechat","agentId":"openai-main" }',
      }),
      endpoint("POST", "/admin/poll", {
        body: '{ "accountId":"acc-a" }',
      }),
      endpoint("POST", "/admin/send", {
        body: '{ "accountId":"acc-a","to":"xxx@im.wechat","text":"hello","contextToken":"" }',
      }),
    ],
  },
  {
    name: "Gateway API (for your backend)",
    items: [
      endpoint("GET", "/api/accounts"),
      endpoint("GET", "/api/contacts", {
        query: "accountId=acc-a&limit=100",
      }),
      endpoint("GET", "/api/inbox", {
        query: "accountId=acc-a&limit=100",
      }),
      endpoint("DELETE", "/api/inbox", {
        query: "accountId=acc-a",
      }),
      endpoint("DELETE", "/api/accounts/{accountId}"),
      endpoint("POST", "/api/send", {
        summary: "Unified send API. Response includes upstream result.",
        body: '{ "to":"xxx@im.wechat","text":"hello","accountId":"acc-a","contextToken":"" }',
      }),
    ],
  },
];

function methodClass(method) {
  const m = method.toUpperCase();
  if (m === "GET") return "get";
  if (m === "POST") return "post";
  if (m === "DELETE") return "del";
  return "any";
}

function renderEndpoint(item) {
  const query = item.query ? `?${item.query}` : "";
  const sampleUrl = `${item.path}${query}`;
  const curlParts = [`curl -X ${item.method} "$BASE_URL${sampleUrl}"`];
  if (item.auth) curlParts.push(`  -H "Authorization: Bearer $ADMIN_TOKEN"`);
  if (item.body) {
    curlParts.push(`  -H "Content-Type: application/json"`);
    curlParts.push(`  -d '${item.body}'`);
  }
  const curl = curlParts.join(" \\\n");
  return `
<details class="ep">
  <summary>
    <span class="badge ${methodClass(item.method)}">${esc(item.method)}</span>
    <code>${esc(item.path)}</code>
    ${item.auth ? '<span class="auth">auth</span>' : '<span class="pub">public</span>'}
  </summary>
  <div class="ep-body">
    ${item.summary ? `<p>${esc(item.summary)}</p>` : ""}
    ${item.query ? `<p><b>Query:</b> <code>${esc(item.query)}</code></p>` : ""}
    ${item.body ? `<p><b>Body:</b></p><pre>${esc(item.body)}</pre>` : ""}
    <p><b>Example:</b></p>
    <pre>${esc(curl)}</pre>
  </div>
</details>
`;
}

function renderDocsHtml() {
  const sections = groups
    .map((g) => {
      const items = g.items.map(renderEndpoint).join("\n");
      return `
<section class="card">
  <h2>${esc(g.name)}</h2>
  ${items}
</section>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WeChat Gateway API Docs</title>
  <style>
    *{box-sizing:border-box}
    body{margin:0;padding:20px;background:#f6f8fc;color:#1b2430;font-family:"Segoe UI","PingFang SC",sans-serif}
    .wrap{max-width:980px;margin:0 auto;display:grid;gap:12px}
    .card{background:#fff;border:1px solid #dbe3ef;border-radius:12px;padding:14px}
    h1{margin:0 0 8px;font-size:24px}
    h2{margin:0 0 10px;font-size:18px}
    p{margin:6px 0}
    code{background:#eef3ff;padding:1px 6px;border-radius:6px}
    pre{margin:6px 0 0;padding:10px;background:#0e1116;color:#d6e0f2;border-radius:8px;overflow:auto}
    .hint{font-size:12px;color:#5e6a7d}
    .top{display:flex;gap:8px;flex-wrap:wrap}
    .btn{display:inline-block;text-decoration:none;background:#1768ff;color:#fff;padding:8px 12px;border-radius:8px}
    .btn.alt{background:#2f3a4d}
    .ep{border:1px solid #e6edf7;border-radius:10px;background:#fff;margin:8px 0}
    .ep summary{cursor:pointer;display:flex;align-items:center;gap:8px;padding:8px 10px;list-style:none}
    .ep summary::-webkit-details-marker{display:none}
    .ep-body{padding:0 10px 10px}
    .badge{display:inline-block;min-width:58px;text-align:center;border-radius:999px;padding:2px 8px;color:#fff;font-size:11px;font-weight:600}
    .badge.get{background:#0f8f51}
    .badge.post{background:#1768ff}
    .badge.del{background:#ca2f2f}
    .badge.any{background:#5e6a7d}
    .auth,.pub{font-size:11px;padding:2px 8px;border-radius:999px}
    .auth{background:#ffe7a8;color:#5a4600}
    .pub{background:#dff5e8;color:#115b34}
  </style>
</head>
<body>
  <div class="wrap">
    <section class="card">
      <h1>WeChat Gateway API Docs</h1>
      <p class="hint">Simple interactive docs. Click each endpoint to view details and examples.</p>
      <p class="hint">Use <code>Authorization: Bearer &lt;ADMIN_TOKEN&gt;</code> for all protected routes.</p>
      <div class="top">
        <a class="btn" href="/admin-ui">Open Admin UI</a>
        <a class="btn alt" href="/">Back Home</a>
      </div>
      <pre>export BASE_URL="${esc('${YOUR_WORKER_BASE_URL}')}"
export ADMIN_TOKEN="${esc('${YOUR_ADMIN_TOKEN}')}";</pre>
    </section>
    ${sections}
  </div>
</body>
</html>`;
}

export function renderDocsUi() {
  return new Response(renderDocsHtml(), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}
