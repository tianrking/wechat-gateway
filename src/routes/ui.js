import { json } from "../utils/common.js";

function html() {
  return `<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>WeChat Gateway Lite</title>
  <style>
    :root {
      --bg: #f7fffd;
      --text: #1f2d3d;
      --muted: #5f7288;
      --line: #d6e9ea;
      --line-soft: #e5f2f4;
      --accent: #2f7ff3;
      --accent-press: #2469cd;
      --alt: #5f89a1;
      --danger: #d24a4a;
      --radius-xl: 24px;
      --radius-lg: 16px;
      --radius-md: 12px;
      --shadow-lg: 0 18px 46px rgba(39, 112, 140, .10);
      --shadow-sm: 0 7px 18px rgba(39, 112, 140, .09);
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 26px;
      color: var(--text);
      font-family: "SF Pro Text", "SF Pro Display", "Segoe UI", "PingFang SC", sans-serif;
      background:
        radial-gradient(960px 560px at -15% -30%, rgba(232, 252, 248, .96) 0%, transparent 62%),
        radial-gradient(1100px 620px at 120% -25%, rgba(223, 241, 255, .9) 0%, transparent 58%),
        radial-gradient(980px 460px at 50% 130%, rgba(236, 248, 255, .8) 0%, transparent 70%),
        var(--bg);
      min-height: 100vh;
    }
    .wrap { max-width: 1120px; margin: 0 auto; display: grid; gap: 15px; animation: riseIn .5s ease; }
    .card {
      position: relative;
      background: linear-gradient(135deg, rgba(255, 255, 255, .92), rgba(241, 252, 250, .74));
      backdrop-filter: blur(16px) saturate(150%);
      -webkit-backdrop-filter: blur(16px) saturate(150%);
      border: 1px solid rgba(213, 232, 236, .98);
      border-radius: var(--radius-xl);
      box-shadow: var(--shadow-lg);
      padding: 17px;
      overflow: hidden;
    }
    .card::before {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(120deg, rgba(255, 255, 255, .62), rgba(255, 255, 255, 0) 45%);
    }
    .card::after {
      content: "";
      position: absolute;
      inset: 0;
      pointer-events: none;
      border-radius: inherit;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
    }
    h1 { margin: 0; font-size: 31px; font-weight: 650; letter-spacing: -.022em; line-height: 1.1; color: #193043; }
    h2 { margin: 0 0 10px; font-size: 17px; font-weight: 610; letter-spacing: -.012em; color: #1f3a52; }
    .hint { font-size: 12px; line-height: 1.5; color: var(--muted); }
    .grid { display: grid; gap: 9px; }
    .two { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    .three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    label { display: grid; gap: 6px; font-size: 12px; color: var(--muted); font-weight: 530; }
    input, select {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 13px;
      padding: 10px 12px;
      font-size: 14px;
      color: var(--text);
      background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(242,252,250,.92));
      box-shadow: inset 0 1px 0 rgba(255,255,255,.7);
      transition: border-color .16s ease, box-shadow .16s ease, background-color .16s ease, transform .08s ease;
    }
    input::placeholder { color: #8ea1b3; }
    input:hover, select:hover { border-color: #bed9dc; }
    input:focus, select:focus {
      outline: none;
      border-color: color-mix(in srgb, var(--accent) 56%, #fff 44%);
      box-shadow: 0 0 0 4px rgba(47, 127, 243, .14), var(--shadow-sm);
      transform: translateY(-1px);
    }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    button {
      border: 0;
      border-radius: 999px;
      padding: 9px 15px;
      background: linear-gradient(180deg, #4a9bff, #2f7ff3);
      color: #fff;
      font-size: 13px;
      font-weight: 590;
      letter-spacing: .01em;
      cursor: pointer;
      box-shadow: 0 8px 18px rgba(47, 127, 243, .24);
      transition: transform .08s ease, box-shadow .16s ease, filter .16s ease;
    }
    button:hover { filter: brightness(1.04); box-shadow: 0 10px 22px rgba(47, 127, 243, .30); }
    button:active { transform: translateY(1px) scale(.995); background: var(--accent-press); box-shadow: 0 4px 10px rgba(47, 127, 243, .22); }
    button.alt { background: linear-gradient(180deg, #72b2c4, #5f89a1); box-shadow: 0 8px 18px rgba(84, 138, 162, .24); }
    button.bad { background: linear-gradient(180deg, #e15c5c, #cd4646); box-shadow: 0 8px 20px rgba(205, 70, 70, .2); }
    .mono {
      background: #11263a;
      color: #e4f5ff;
      font-family: var(--mono);
      font-size: 12px;
      border-radius: var(--radius-lg);
      padding: 11px;
      white-space: pre-wrap;
      max-height: 320px;
      overflow: auto;
      border: 1px solid #2a4f6d;
    }
    .log-list { max-height: 340px; overflow: auto; display: grid; gap: 8px; }
    .log-item { border: 1px solid var(--line-soft); border-radius: var(--radius-lg); background: rgba(255,255,255,.95); overflow: hidden; }
    .log-item summary { cursor: pointer; padding: 9px 11px; font-family: var(--mono); font-size: 12px; color: #2d4c63; background: linear-gradient(180deg, #f9fffe, #f1f9f8); }
    .log-item pre { margin: 0; padding: 10px; border-top: 1px solid var(--line-soft); background: #10263a; color: #def4ff; font-family: var(--mono); font-size: 12px; white-space: pre-wrap; }
    .top-links a {
      display: inline-block;
      text-decoration: none;
      border-radius: 999px;
      padding: 9px 13px;
      background: linear-gradient(180deg, #63b6bf, #4f96c8);
      color: #fff;
      font-size: 13px;
      font-weight: 560;
      box-shadow: 0 8px 18px rgba(79, 150, 200, .25);
    }
    .preview-mask { position: fixed; inset: 0; background: rgba(7, 35, 53, .24); display: none; align-items: center; justify-content: center; padding: 22px; z-index: 9999; backdrop-filter: blur(8px); }
    .preview-box { width: min(980px, 96vw); max-height: 90vh; overflow: auto; background: linear-gradient(180deg, rgba(255,255,255,.98), rgba(240,251,250,.95)); border-radius: var(--radius-xl); border: 1px solid var(--line); padding: 13px; display: grid; gap: 10px; box-shadow: 0 20px 52px rgba(27, 86, 111, .2); }
    .preview-head { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .preview-body img, .preview-body video { max-width: 100%; max-height: 72vh; border-radius: var(--radius-md); border: 1px solid var(--line-soft); background: #000; }
    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      border: 1px solid var(--line-soft);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: rgba(255,255,255,.98);
    }
    th, td { border-bottom: 1px solid var(--line-soft); text-align: left; padding: 9px; font-size: 13px; vertical-align: top; }
    th { background: linear-gradient(180deg, #f2fdfa, #e8f7f7); font-weight: 610; color: #36566d; position: sticky; top: 0; z-index: 1; }
    tbody tr { transition: background-color .14s ease; }
    tbody tr:hover { background: rgba(229, 247, 246, .7); }
    tr:last-child td { border-bottom: 0; }
    .msg-stack { display: grid; gap: 6px; }
    .msg-text { white-space: pre-wrap; word-break: break-word; line-height: 1.42; }
    .msg-media { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .tag { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; background: linear-gradient(180deg, #e7faf6, #dcf4f6); color: #2c657f; border: 1px solid #bee8e7; }
    .table-action { white-space: nowrap; }
    img { width: 240px; max-width: 100%; height: 240px; object-fit: contain; border: 1px solid var(--line); border-radius: var(--radius-lg); background: #fff; }
    @keyframes riseIn {
      from { opacity: .65; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 920px) {
      body { padding: 16px; }
      .wrap { max-width: 100%; gap: 12px; }
      .card { border-radius: 16px; padding: 13px; }
      h1 { font-size: 25px; }
      .two, .three { grid-template-columns: 1fr; }
      button { width: 100%; justify-content: center; }
      .row { gap: 7px; }
    }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="card">
      <h1>WeChat Gateway Lite</h1>
      <div class="hint">只保留你要的功能：扫码加号、管理多账号、REST 交互。 / Core only: QR onboarding, multi-account management, REST interaction.</div>
      <div class="hint">Author: w0x7ce</div>
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
        <button type="button" class="alt" id="btnInboxAuto">自动刷新: 开 / Auto: ON (10s)</button>
        <button type="button" class="alt" id="btnInboxClear">清空当前账户消息 / Clear Current Account Inbox</button>
      </div>
      <table>
        <thead><tr><th>time</th><th>accountId</th><th>from</th><th>kind</th><th>text / media</th><th>action</th></tr></thead>
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
  <div id="previewMask" class="preview-mask">
    <div class="preview-box">
      <div class="preview-head">
        <strong id="previewTitle">Preview</strong>
        <button type="button" class="bad" id="btnPreviewClose">关闭 / Close</button>
      </div>
      <div class="preview-body" id="previewBody"></div>
    </div>
  </div>
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
    autoInbox: true,
    inboxTimer: null,
  };
  const $ = (id) => document.getElementById(id);
  const logEl = $("log");
  const previewMask = $("previewMask");
  const previewBody = $("previewBody");
  const previewTitle = $("previewTitle");
  let previewUrl = "";
  const esc = (v) => String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  const attrEsc = (v) => String(v || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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
  const closePreview = () => {
    previewMask.style.display = "none";
    previewBody.innerHTML = "";
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = "";
    }
  };
  const openPreview = async (path, mode, name) => {
    try {
      const res = await fetch(base() + path, {
        method: "GET",
        headers: { authorization: "Bearer " + token() },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error("preview failed " + res.status + " " + txt);
      }
      const blob = await res.blob();
      previewUrl = URL.createObjectURL(blob);
      previewTitle.textContent = name || "Preview";
      if (mode === "video") {
        previewBody.innerHTML = "<video controls autoplay src='" + previewUrl + "'></video>";
      } else {
        previewBody.innerHTML = "<img alt='preview' src='" + previewUrl + "' />";
      }
      previewMask.style.display = "flex";
    } catch (e) {
      log(String(e));
    }
  };
  const token = () => $("token").value.trim();
  const base = () => $("base").value.trim() || location.origin;

  const selectedAccountId = () => $("sendAccSelect").value.trim();
  const INBOX_INTERVAL_MS = 10_000;
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
        (() => {
          const media = Array.isArray(x.media) ? x.media : [];
          const mediaBrief = media.map((m) => {
            const t = m?.type || "media";
            const n = m?.fileName ? (" " + m.fileName) : "";
            const ct = String(m?.contentType || "").toLowerCase();
            const previewMode = ct.startsWith("image/") || t === "image"
              ? "image"
              : (ct.startsWith("video/") || t === "video" ? "video" : "");
            const pv = m?.downloadPath && previewMode
              ? (" <button type='button' class='alt' data-pv='" + attrEsc(m.downloadPath) + "' data-pv-mode='" + previewMode + "' data-name='" + attrEsc(m.downloadName || m.fileName || (t + ".bin")) + "'>预览</button>")
              : "";
            const dl = m?.downloadPath
              ? (" <button type='button' class='alt' data-dl='" + attrEsc(m.downloadPath) + "' data-name='" + attrEsc(m.downloadName || m.fileName || (t + ".bin")) + "'>下载</button>")
              : "";
            const reason = m?.archiveReason ? (" (" + esc(m.archiveReason) + ")") : "";
            return "<div class='msg-media'><span class='tag'>" + esc(t) + "</span><span>" + esc(n.trim()) + "</span>" + pv + dl + "<span>" + reason + "</span></div>";
          }).join("");
          const textBlock = x.text ? ("<div class='msg-text'>" + esc(x.text) + "</div>") : "";
          const contentInner = textBlock + mediaBrief;
          const content = "<div class='msg-stack'>" + (contentInner || "<span class='hint'>empty</span>") + "</div>";
          return "<tr>"
            + "<td>" + fmtTime(x.createdAt) + "</td>"
            + "<td>" + esc(x.accountId || "") + "</td>"
            + "<td>" + esc(x.userId || "") + "</td>"
            + "<td><span class='tag'>" + esc(x.kind || "text") + "</span></td>"
            + "<td>" + content + "</td>"
            + "<td class='table-action'><button type='button' class='bad' data-del-msg-account='" + attrEsc(x.accountId || "") + "' data-del-msg-id='" + attrEsc(x.id || "") + "' data-del-msg-created='" + attrEsc(String(x.createdAt || "")) + "'>删除 / Delete</button></td>"
            + "</tr>";
        })()
      ).join("");
      $("inboxRows").innerHTML = rows || "<tr><td colspan='6'>暂无消息 / No inbound messages</td></tr>";
      document.querySelectorAll("button[data-dl]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const path = btn.getAttribute("data-dl") || "";
          const name = btn.getAttribute("data-name") || "media.bin";
          if (!path) return;
          try {
            const res = await fetch(base() + path, {
              method: "GET",
              headers: { authorization: "Bearer " + token() },
            });
            if (!res.ok) {
              const txt = await res.text();
              throw new Error("download failed " + res.status + " " + txt);
            }
            const blob = await res.blob();
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = name;
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(link.href), 2000);
          } catch (e) {
            log(String(e));
          }
        });
      });
      document.querySelectorAll("button[data-pv]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const path = btn.getAttribute("data-pv") || "";
          const mode = btn.getAttribute("data-pv-mode") || "image";
          const name = btn.getAttribute("data-name") || "preview";
          if (!path) return;
          await openPreview(path, mode, name);
        });
      });
      document.querySelectorAll("button[data-del-msg-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const accountId = btn.getAttribute("data-del-msg-account") || "";
          const id = btn.getAttribute("data-del-msg-id") || "";
          const createdAt = btn.getAttribute("data-del-msg-created") || "";
          if (!accountId || !id) return;
          if (!confirm("确认删除该消息? / Confirm delete this message?")) return;
          try {
            const qDel = "?accountId=" + encodeURIComponent(accountId)
              + "&id=" + encodeURIComponent(id)
              + (createdAt ? ("&createdAt=" + encodeURIComponent(createdAt)) : "");
            const dDel = await api("/api/inbox/item" + qDel, "DELETE");
            log(dDel);
            await refreshInbox();
          } catch (e) {
            log(String(e));
          }
        });
      });
      return d;
    } catch (e) {
      log(String(e));
      return null;
    }
  };

  const setInboxAuto = (on) => {
    st.autoInbox = Boolean(on);
    if (st.inboxTimer) {
      clearInterval(st.inboxTimer);
      st.inboxTimer = null;
    }
    $("btnInboxAuto").textContent = st.autoInbox
      ? "自动刷新: 开 / Auto: ON (10s)"
      : "自动刷新: 关 / Auto: OFF";
    if (st.autoInbox) {
      st.inboxTimer = setInterval(() => {
        refreshInbox();
      }, INBOX_INTERVAL_MS);
    }
  };

  const toggleInboxAuto = () => {
    setInboxAuto(!st.autoInbox);
    log(st.autoInbox ? "已开启每10秒自动刷新消息。 / Auto refresh enabled." : "已关闭自动刷新消息。 / Auto refresh disabled.");
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
  $("btnInboxAuto").addEventListener("click", toggleInboxAuto);
  $("btnInboxClear").addEventListener("click", clearInbox);
  $("btnPreviewClose").addEventListener("click", closePreview);
  $("previewMask").addEventListener("click", (e) => {
    if (e.target === previewMask) closePreview();
  });
  $("sendAccSelect").addEventListener("change", async () => {
    const accountId = selectedAccountId();
    if (accountId && st.currentUserByAccount[accountId]) {
      $("to").value = st.currentUserByAccount[accountId];
    }
    await refreshContacts();
    await refreshInbox();
  });

  renderLogs();
  setInboxAuto(true);
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
