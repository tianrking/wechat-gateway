import { json } from "../utils/common.js";

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WeChat Gateway Lite</title>
  <style>
    * { box-sizing: border-box; }
    body { margin:0; padding:20px; font-family: "Segoe UI", "PingFang SC", sans-serif; background:#f5f7fb; color:#1b2430; }
    .wrap { max-width: 920px; margin:0 auto; display:grid; gap:14px; }
    .card { background:#fff; border:1px solid #dbe3ef; border-radius:12px; padding:14px; }
    h1 { margin:0; font-size:22px; }
    h2 { margin:0 0 10px; font-size:16px; }
    .hint { font-size:12px; color:#5e6a7d; }
    .grid { display:grid; gap:8px; }
    .two { grid-template-columns: repeat(2, minmax(0,1fr)); }
    .three { grid-template-columns: repeat(3, minmax(0,1fr)); }
    label { display:grid; gap:4px; font-size:12px; color:#5e6a7d; }
    input, select { width:100%; border:1px solid #dbe3ef; border-radius:8px; padding:9px 10px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; }
    button { border:0; border-radius:8px; padding:8px 12px; background:#1768ff; color:#fff; cursor:pointer; }
    button.alt { background:#2f3a4d; }
    button.bad { background:#ca2f2f; }
    .mono { background:#0e1116; color:#d6e0f2; font-family:ui-monospace,Consolas,monospace; font-size:12px; border-radius:8px; padding:10px; white-space:pre-wrap; max-height:280px; overflow:auto; }
    .log-list { max-height:320px; overflow:auto; display:grid; gap:8px; }
    .log-item { border:1px solid #dbe3ef; border-radius:8px; background:#fff; }
    .log-item summary { cursor:pointer; padding:8px 10px; font-family:ui-monospace,Consolas,monospace; font-size:12px; color:#1b2430; }
    .log-item pre { margin:0; padding:10px; border-top:1px solid #e7edf7; background:#0e1116; color:#d6e0f2; font-family:ui-monospace,Consolas,monospace; font-size:12px; white-space:pre-wrap; }
    .top-links a { display:inline-block; text-decoration:none; border-radius:8px; padding:8px 12px; background:#2f3a4d; color:#fff; font-size:13px; }
    table { width:100%; border-collapse: collapse; }
    th, td { border-bottom:1px solid #e7edf7; text-align:left; padding:8px; font-size:13px; }
    img { width:220px; height:220px; object-fit:contain; border:1px solid #dbe3ef; border-radius:8px; background:#fff; }
    @media (max-width: 820px){ .two, .three { grid-template-columns:1fr; } }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>WeChat Gateway Lite</h1>
      <div class="hint">只保留你要的功能：扫码加号、管理多账号、REST 交互。 / Core only: QR onboarding, multi-account management, REST interaction.</div>
      <div class="row top-links">
        <a href="/docs" target="_blank" rel="noopener">API Docs</a>
      </div>
    </div>

    <div class="card grid two">
      <div class="grid">
        <h2>连接 / Connection</h2>
        <label>ADMIN_TOKEN <input id="token" type="password" placeholder="输入 ADMIN_TOKEN / Enter ADMIN_TOKEN" /></label>
        <label>Base URL <input id="base" /></label>
        <div class="row">
          <button type="button" id="btnSaveConn">保存 / Save</button>
          <button type="button" class="alt" id="btnOverview">测试 / Test</button>
        </div>
      </div>
      <div class="grid">
        <h2>扫码添加账户 / QR Add Account</h2>
        <label>iLink Base URL <input id="qrBase" value="https://ilinkai.weixin.qq.com" /></label>
        <label>Account ID（可选 / Optional） <input id="accHint" placeholder="如 / e.g. acc-a" /></label>
        <label>Space <input id="space" value="default" /></label>
        <div class="row">
          <button type="button" id="btnStartLogin">开始扫码 / Start</button>
          <button type="button" class="alt" id="btnStatusLogin">刷新状态 / Refresh</button>
          <button type="button" id="btnConfirmLogin">确认入库 / Confirm</button>
        </div>
      </div>
    </div>

    <div class="card grid two">
      <div class="grid">
        <h2>二维码 / QR</h2>
        <img id="qr" alt="QR" />
      </div>
      <div class="grid">
        <h2>扫码会话信息 / Login Session</h2>
        <div id="loginInfo" class="mono"></div>
      </div>
    </div>

    <div class="card grid">
      <h2>账户管理（可添加多个，可删除） / Account Management</h2>
      <div class="row">
        <button type="button" id="btnListAccounts">刷新列表 / Refresh</button>
        <button type="button" class="alt" id="btnPollNow">立即拉取消息 / Poll Now</button>
      </div>
      <table>
        <thead><tr><th>accountId</th><th>botId</th><th>space</th><th>enabled</th><th>action</th></tr></thead>
        <tbody id="accRows"></tbody>
      </table>
    </div>

    <div class="card grid">
      <h2>REST 发送测试（统一接口） / REST Send Test</h2>
      <div class="grid three">
        <label>to <input id="to" placeholder="xxx@im.wechat" /></label>
        <label>text <input id="text" placeholder="hello" /></label>
        <label>发送账号 / Sender Account <select id="sendAccSelect"><option value="">自动选账号 / Auto</option></select></label>
      </div>
      <div class="grid two">
        <label>最近联系人（按账号） / Recent Contacts (by account)
          <select id="contactPick"><option value="">请选择联系人 / Select contact</option></select>
        </label>
      </div>
      <div class="row">
        <button type="button" class="alt" id="btnUseRecent">填充联系人到 to / Fill to</button>
        <button type="button" class="alt" id="btnUseLoginUser">使用当前登录用户ID / Use Current User</button>
        <button type="button" id="btnSendTest">调用 /api/send</button>
      </div>
      <div class="hint">你后端直接调 <code>/api/send</code> 就行，不需要管理微信细节。 / Your backend can call <code>/api/send</code> directly.</div>
      <div class="hint">收不到消息时，请先在微信里给机器人发一条消息触发会话，再重试发送。 / If messages are not received, send one message from WeChat first, then retry.</div>
    </div>

    <div class="card grid">
      <h2>入站消息（按账户查看） / Inbound Messages</h2>
      <div class="row">
        <button type="button" id="btnInboxRefresh">刷新消息 / Refresh Inbox</button>
        <button type="button" class="alt" id="btnInboxClear">清空当前账户消息 / Clear Current Account Inbox</button>
      </div>
      <table>
        <thead><tr><th>time</th><th>accountId</th><th>from</th><th>text</th></tr></thead>
        <tbody id="inboxRows"></tbody>
      </table>
      <div class="hint">按“发送账号 / Sender Account”筛选；不选账号时显示全部。</div>
    </div>

    <div class="card">
      <h2>日志 / Logs</h2>
      <div class="row">
        <button type="button" class="alt" id="btnClearLogs">清空日志 / Clear Logs</button>
      </div>
      <div id="log" class="log-list"></div>
    </div>
  </div>

  <script src="/admin-ui.js" defer></script>
</body>
</html>`;
}

export function renderAdminUi() {
  return new Response(html(), {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function renderAdminUiScript() {
  const script = `
(() => {
  const st = {
    sessionId: localStorage.getItem("wg_session") || "",
    currentUserId: localStorage.getItem("wg_current_user_id") || "",
    currentUserByAccount: (() => {
      try {
        const raw = localStorage.getItem("wg_user_by_account") || "{}";
        return JSON.parse(raw) || {};
      } catch {
        return {};
      }
    })(),
    accounts: [],
    contacts: [],
    inbox: [],
    logs: [],
    reqSeq: 0,
  };
  const $ = (id) => document.getElementById(id);
  const logEl = $("log");
  const esc = (v) => String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const stringify = (v) => {
    if (typeof v === "string") return v;
    try { return JSON.stringify(v, null, 2); } catch { return String(v); }
  };
  const renderLogs = () => {
    if (!st.logs.length) {
      logEl.innerHTML = "<div class='hint'>No logs yet.</div>";
      return;
    }
    logEl.innerHTML = st.logs.map((item) => {
      const req = item.request ? ("[request]\\n" + stringify(item.request) + "\\n\\n") : "";
      const res = item.response ? ("[response]\\n" + stringify(item.response) + "\\n\\n") : "";
      const err = item.error ? ("[error]\\n" + stringify(item.error)) : "";
      const body = esc((req + res + err).trim());
      return "<details class='log-item'" + (item.open ? " open" : "") + ">"
        + "<summary>" + esc(item.summary) + "</summary>"
        + "<pre>" + body + "</pre>"
        + "</details>";
    }).join("");
  };
  const pushLog = (entry) => {
    st.logs.unshift(entry);
    if (st.logs.length > 120) st.logs.length = 120;
    renderLogs();
  };
  const log = (x) => {
    pushLog({
      summary: "[" + new Date().toISOString() + "] note",
      response: typeof x === "string" ? { message: x } : x,
      open: false,
    });
  };
  const clearLogs = () => {
    st.logs = [];
    renderLogs();
  };
  const token = () => $("token").value.trim();
  const base = () => $("base").value.trim() || location.origin;

  const selectedAccountId = () => $("sendAccSelect").value.trim();
  const fmtTime = (ts) => {
    const n = Number(ts || 0);
    if (!n) return "";
    return new Date(n).toISOString().replace("T", " ").replace("Z", " UTC");
  };

  const saveConn = () => {
    localStorage.setItem("wg_token", token());
    localStorage.setItem("wg_base", base());
    log("连接信息已保存 / Connection saved");
  };

  const loadConn = () => {
    $("token").value = localStorage.getItem("wg_token") || "";
    $("base").value = localStorage.getItem("wg_base") || location.origin;
    if (st.currentUserId) $("to").value = st.currentUserId;
  };

  const extractUserId = (data) => {
    return (
      data?.loginStatus?.ilink_user_id ||
      data?.status?.ilink_user_id ||
      data?.session?.rawStatus?.ilink_user_id ||
      data?.rawStatus?.ilink_user_id ||
      ""
    );
  };

  const rememberUserId = (uid, accountId) => {
    const userId = String(uid || "").trim();
    if (!userId) return;
    st.currentUserId = userId;
    localStorage.setItem("wg_current_user_id", userId);
    if (accountId) {
      st.currentUserByAccount[accountId] = userId;
      localStorage.setItem("wg_user_by_account", JSON.stringify(st.currentUserByAccount));
    }
    $("to").value = userId;
  };

  const setQr = async (data) => {
    const raw = data?.qrcode_img_content || data?.session?.qrcodeImg || data?.status?.qrcode_img_content || "";
    const qrt = data?.qrcode || data?.session?.qrcode || "";
    const text = String(raw || qrt || "").trim();
    let src = "";
    if (text.startsWith("data:image/")) {
      src = text;
    } else if (/^[A-Za-z0-9+/=]+$/.test(text) && text.length > 200) {
      src = "data:image/png;base64," + text;
    } else if (text) {
      src = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=" + encodeURIComponent(text);
    }
    if (src) $("qr").src = src;
    if (!src) log("二维码生成失败：上游未返回可用二维码文本。 / QR generation failed.");
  };

  const api = async (path, method = "GET", body) => {
    const reqId = ++st.reqSeq;
    const startedAt = Date.now();
    const res = await fetch(base() + path, {
      method,
      headers: { "content-type": "application/json", authorization: "Bearer " + token() },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let d;
    try { d = JSON.parse(txt); } catch { d = { raw: txt }; }
    const costMs = Date.now() - startedAt;
    pushLog({
      summary: "[" + new Date().toISOString() + "] #" + reqId + " " + method + " " + path + " -> " + res.status + " (" + costMs + "ms)",
      request: { method, path, body: body || null },
      response: d,
      error: res.ok ? null : { status: res.status },
      open: !res.ok,
    });
    if (!res.ok) throw new Error(String(res.status) + " " + JSON.stringify(d));
    return d;
  };

  const overview = async () => { try { log(await api("/admin/overview")); } catch (e) { log(String(e)); } };

  const syncSendAccountSelect = () => {
    const sel = $("sendAccSelect");
    const old = sel.value;
    const options = ["<option value=''>自动选账号 / Auto</option>"];
    st.accounts.forEach((a) => {
      options.push("<option value='" + a.accountId + "'>" + a.accountId + " (" + (a.space || "default") + ")</option>");
    });
    sel.innerHTML = options.join("");
    if (old && st.accounts.some((a) => a.accountId === old)) {
      sel.value = old;
    }
  };

  const refreshContacts = async () => {
    try {
      const acc = selectedAccountId();
      const q = acc ? ("?accountId=" + encodeURIComponent(acc) + "&limit=100") : "?limit=100";
      const d = await api("/api/contacts" + q);
      st.contacts = Array.isArray(d.items) ? d.items : [];
      const sel = $("contactPick");
      const items = st.contacts.map((x) => {
        const suffix = x.accountId ? (" [" + x.accountId + "]") : "";
        return "<option value='" + x.userId + "'>" + x.userId + suffix + "</option>";
      });
      sel.innerHTML = "<option value=''>请选择联系人 / Select contact</option>" + items.join("");
      return d;
    } catch (e) {
      log(String(e));
      return null;
    }
  };

  const refreshInbox = async () => {
    try {
      const acc = selectedAccountId();
      const q = acc ? ("?accountId=" + encodeURIComponent(acc) + "&limit=100") : "?limit=100";
      const d = await api("/api/inbox" + q);
      st.inbox = Array.isArray(d.items) ? d.items : [];
      const rows = st.inbox.map((x) =>
        "<tr>"
        + "<td>" + fmtTime(x.createdAt) + "</td>"
        + "<td>" + (x.accountId || "") + "</td>"
        + "<td>" + (x.userId || "") + "</td>"
        + "<td>" + esc(x.text || "") + "</td>"
        + "</tr>"
      ).join("");
      $("inboxRows").innerHTML = rows || "<tr><td colspan='4'>暂无消息 / No inbound messages</td></tr>";
      return d;
    } catch (e) {
      log(String(e));
      return null;
    }
  };

  const clearInbox = async () => {
    try {
      const acc = selectedAccountId();
      if (!acc) {
        log("请先选择发送账号后再清空对应消息。 / Select an account first.");
        return;
      }
      if (!confirm("确认清空该账户的入站消息? / Clear inbox for account: " + acc + " ?")) return;
      const d = await api("/api/inbox?accountId=" + encodeURIComponent(acc), "DELETE");
      log(d);
      await refreshInbox();
    } catch (e) { log(String(e)); }
  };

  const startLogin = async () => {
    try {
      const d = await api("/admin/login/start", "POST", { baseUrl: $("qrBase").value.trim(), accountIdHint: $("accHint").value.trim() });
      st.sessionId = d.sessionId;
      localStorage.setItem("wg_session", st.sessionId);
      $("loginInfo").textContent = JSON.stringify(d, null, 2);
      await setQr(d);
      log(d);
    } catch (e) { log(String(e)); }
  };

  const statusLogin = async (silent) => {
    try {
      if (!st.sessionId) return null;
      const d = await api("/admin/login/status?sessionId=" + encodeURIComponent(st.sessionId));
      $("loginInfo").textContent = JSON.stringify(d, null, 2);
      rememberUserId(extractUserId(d));
      await setQr(d);
      log(d);
      return d;
    } catch (e) { if (!silent) log(String(e)); }
    return null;
  };

  const confirmLogin = async () => {
    try {
      if (!st.sessionId) throw new Error("请先开始扫码 / Start QR first");
      const d = await api("/admin/login/confirm", "POST", { sessionId: st.sessionId, accountId: $("accHint").value.trim() || undefined, space: $("space").value.trim() || "default" });
      $("loginInfo").textContent = JSON.stringify(d, null, 2);
      rememberUserId(extractUserId(d), d?.account?.accountId);
      log(d);
      await listAccounts();
    } catch (e) { log(String(e)); }
  };

  const listAccounts = async () => {
    try {
      const d = await api("/api/accounts");
      st.accounts = Array.isArray(d.items) ? d.items : [];
      const rows = st.accounts.map((a) =>
        "<tr>"
        + "<td>" + a.accountId + "</td>"
        + "<td>" + (a.botId || "") + "</td>"
        + "<td>" + (a.space || "") + "</td>"
        + "<td>" + String(a.enabled) + "</td>"
        + "<td><button type='button' class='bad' data-del='" + a.accountId + "'>删除 / Delete</button></td>"
        + "</tr>"
      ).join("");
      $("accRows").innerHTML = rows || "<tr><td colspan='5'>暂无账号 / No accounts</td></tr>";
      syncSendAccountSelect();
      await refreshContacts();
      await refreshInbox();

      document.querySelectorAll("button[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-del");
          if (!id) return;
          if (!confirm("确认删除账号 / Confirm delete account: " + id + " ?")) return;
          try {
            log(await api("/api/accounts/" + encodeURIComponent(id), "DELETE"));
            await listAccounts();
          } catch (e) { log(String(e)); }
        });
      });

      log("accounts=" + st.accounts.length);
    } catch (e) { log(String(e)); }
  };

  const sendTest = async () => {
    try {
      const accountId = selectedAccountId();
      const d = await api("/api/send", "POST", {
        to: $("to").value.trim(),
        text: $("text").value,
        accountId: accountId || undefined,
      });
      if (accountId && $("to").value.trim()) {
        rememberUserId($("to").value.trim(), accountId);
      }
      log(d);
      await refreshContacts();
    } catch (e) { log(String(e)); }
  };

  const pollNow = async () => {
    try {
      const accountId = selectedAccountId();
      const d = await api("/admin/poll", "POST", {
        accountId: accountId || undefined,
      });
      log(d);
      await refreshInbox();
    } catch (e) { log(String(e)); }
  };

  const useLoginUser = () => {
    const accountId = selectedAccountId();
    const mapped = accountId ? st.currentUserByAccount[accountId] : "";
    if (mapped) {
      $("to").value = mapped;
      log("已填充该账号最近登录用户ID / Filled mapped user ID: " + mapped);
      return;
    }
    if (st.currentUserId) {
      $("to").value = st.currentUserId;
      log("已填充当前登录用户ID / Filled current user ID: " + st.currentUserId);
      return;
    }
    try {
      const raw = $("loginInfo").textContent || "";
      const data = raw ? JSON.parse(raw) : null;
      const uid = extractUserId(data);
      if (uid) {
        rememberUserId(uid, accountId);
        log("已从扫码会话信息提取用户ID / Extracted from login status: " + uid);
      } else {
        log("未找到用户ID，请先扫码并刷新状态/确认入库。 / User ID not found.");
      }
    } catch {
      log("当前会话信息不是有效 JSON，无法提取用户ID。 / Invalid login info JSON.");
    }
  };

  const useRecent = () => {
    const uid = $("contactPick").value.trim();
    if (!uid) {
      log("请先选择最近联系人。 / Select a contact first.");
      return;
    }
    $("to").value = uid;
    const accountId = selectedAccountId();
    if (accountId) rememberUserId(uid, accountId);
    log("已填充联系人 / Contact selected: " + uid);
  };

  const initLoginSession = async () => {
    if (!st.sessionId) {
      await startLogin();
      return;
    }
    const d = await statusLogin(true);
    if (!d || !d.ok) {
      st.sessionId = "";
      localStorage.removeItem("wg_session");
      await startLogin();
    }
  };

  $("btnSaveConn").addEventListener("click", saveConn);
  $("btnOverview").addEventListener("click", overview);
  $("btnStartLogin").addEventListener("click", startLogin);
  $("btnStatusLogin").addEventListener("click", () => statusLogin(false));
  $("btnConfirmLogin").addEventListener("click", confirmLogin);
  $("btnListAccounts").addEventListener("click", listAccounts);
  $("btnPollNow").addEventListener("click", pollNow);
  $("btnUseLoginUser").addEventListener("click", useLoginUser);
  $("btnUseRecent").addEventListener("click", useRecent);
  $("btnSendTest").addEventListener("click", sendTest);
  $("btnClearLogs").addEventListener("click", clearLogs);
  $("btnInboxRefresh").addEventListener("click", refreshInbox);
  $("btnInboxClear").addEventListener("click", clearInbox);
  $("sendAccSelect").addEventListener("change", async () => {
    const accountId = selectedAccountId();
    if (accountId && st.currentUserByAccount[accountId]) {
      $("to").value = st.currentUserByAccount[accountId];
    }
    await refreshContacts();
    await refreshInbox();
  });

  renderLogs();
  loadConn();
  initLoginSession();
  listAccounts();
  refreshInbox();
})();
`;

  return new Response(script, {
    status: 200,
    headers: {
      "content-type": "application/javascript; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function notFound() {
  return json({ ok: false, error: "not found" }, 404);
}
