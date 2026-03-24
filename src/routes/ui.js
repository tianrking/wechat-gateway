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
    input { width:100%; border:1px solid #dbe3ef; border-radius:8px; padding:9px 10px; }
    .row { display:flex; gap:8px; flex-wrap:wrap; }
    button { border:0; border-radius:8px; padding:8px 12px; background:#1768ff; color:#fff; cursor:pointer; }
    button.alt { background:#2f3a4d; }
    button.bad { background:#ca2f2f; }
    .mono { background:#0e1116; color:#d6e0f2; font-family:ui-monospace,Consolas,monospace; font-size:12px; border-radius:8px; padding:10px; white-space:pre-wrap; max-height:280px; overflow:auto; }
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
      <div class="hint">只保留你要的功能：扫码加号、管理多账号、REST 交互。</div>
    </div>

    <div class="card grid two">
      <div class="grid">
        <h2>连接</h2>
        <label>ADMIN_TOKEN <input id="token" type="password" placeholder="输入 ADMIN_TOKEN" /></label>
        <label>Base URL <input id="base" /></label>
        <div class="row">
          <button type="button" id="btnSaveConn">保存</button>
          <button type="button" class="alt" id="btnOverview">测试</button>
        </div>
      </div>
      <div class="grid">
        <h2>扫码添加账户</h2>
        <label>iLink Base URL <input id="qrBase" value="https://ilinkai.weixin.qq.com" /></label>
        <label>Account ID（可选） <input id="accHint" placeholder="如 acc-a" /></label>
        <label>Space <input id="space" value="default" /></label>
        <div class="row">
          <button type="button" id="btnStartLogin">开始扫码</button>
          <button type="button" class="alt" id="btnStatusLogin">刷新状态</button>
          <button type="button" id="btnConfirmLogin">确认入库</button>
        </div>
      </div>
    </div>

    <div class="card grid two">
      <div class="grid">
        <h2>二维码</h2>
        <img id="qr" alt="QR" />
      </div>
      <div class="grid">
        <h2>扫码会话信息</h2>
        <div id="loginInfo" class="mono"></div>
      </div>
    </div>

    <div class="card grid">
      <h2>账户管理（可添加多个，可删除）</h2>
      <div class="row">
        <button type="button" id="btnListAccounts">刷新列表</button>
      </div>
      <table>
        <thead><tr><th>accountId</th><th>botId</th><th>space</th><th>enabled</th><th>action</th></tr></thead>
        <tbody id="accRows"></tbody>
      </table>
    </div>

    <div class="card grid">
      <h2>REST 发送测试（统一接口）</h2>
      <div class="grid three">
        <label>to <input id="to" placeholder="xxx@im.wechat" /></label>
        <label>text <input id="text" placeholder="hello" /></label>
        <label>accountId（可选） <input id="sendAcc" placeholder="不填则自动选账号" /></label>
      </div>
      <div class="row">
        <button type="button" class="alt" id="btnUseLoginUser">使用当前登录用户ID</button>
        <button type="button" id="btnSendTest">调用 /api/send</button>
      </div>
      <div class="hint">你后端直接调 <code>/api/send</code> 就行，不需要管理微信细节。</div>
    </div>

    <div class="card">
      <h2>日志</h2>
      <div id="log" class="mono"></div>
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
  };
  const $ = (id) => document.getElementById(id);
  const logEl = $("log");
  const log = (x) => {
    const old = logEl.textContent || "";
    logEl.textContent = "[" + new Date().toISOString() + "]\\n" + (typeof x === "string" ? x : JSON.stringify(x, null, 2)) + "\\n\\n" + old;
  };
  const token = () => $("token").value.trim();
  const base = () => $("base").value.trim() || location.origin;

  const saveConn = () => {
    localStorage.setItem("wg_token", token());
    localStorage.setItem("wg_base", base());
    log("连接信息已保存");
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

  const rememberUserId = (uid) => {
    const userId = String(uid || "").trim();
    if (!userId) return;
    st.currentUserId = userId;
    localStorage.setItem("wg_current_user_id", userId);
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
      // iLink commonly returns QR content text rather than direct image URL.
      src = "https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=" + encodeURIComponent(text);
    }
    if (src) $("qr").src = src;
    if (!src) log("二维码生成失败：上游未返回可用二维码文本。");
  };

  const api = async (path, method = "GET", body) => {
    const res = await fetch(base() + path, {
      method,
      headers: { "content-type": "application/json", authorization: "Bearer " + token() },
      body: body ? JSON.stringify(body) : undefined,
    });
    const txt = await res.text();
    let d;
    try { d = JSON.parse(txt); } catch { d = { raw: txt }; }
    if (!res.ok) throw new Error(String(res.status) + " " + JSON.stringify(d));
    return d;
  };

  const overview = async () => { try { log(await api("/admin/overview")); } catch (e) { log(String(e)); } };

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
      if (!st.sessionId) throw new Error("请先开始扫码");
      const d = await api("/admin/login/confirm", "POST", { sessionId: st.sessionId, accountId: $("accHint").value.trim() || undefined, space: $("space").value.trim() || "default" });
      $("loginInfo").textContent = JSON.stringify(d, null, 2);
      rememberUserId(extractUserId(d));
      log(d);
      await listAccounts();
    } catch (e) { log(String(e)); }
  };

  const listAccounts = async () => {
    try {
      const d = await api("/api/accounts");
      const rows = (d.items || []).map((a) =>
        "<tr>"
        + "<td>" + a.accountId + "</td>"
        + "<td>" + (a.botId || "") + "</td>"
        + "<td>" + (a.space || "") + "</td>"
        + "<td>" + String(a.enabled) + "</td>"
        + "<td><button type='button' class='bad' data-del='" + a.accountId + "'>删除</button></td>"
        + "</tr>"
      ).join("");
      $("accRows").innerHTML = rows || "<tr><td colspan='5'>暂无账号</td></tr>";

      document.querySelectorAll("button[data-del]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const id = btn.getAttribute("data-del");
          if (!id) return;
          if (!confirm("确认删除账号 " + id + " ?")) return;
          try {
            log(await api("/api/accounts/" + encodeURIComponent(id), "DELETE"));
            await listAccounts();
          } catch (e) { log(String(e)); }
        });
      });

      log("accounts=" + (d.items || []).length);
    } catch (e) { log(String(e)); }
  };

  const sendTest = async () => {
    try {
      const d = await api("/api/send", "POST", {
        to: $("to").value.trim(),
        text: $("text").value,
        accountId: $("sendAcc").value.trim() || undefined,
      });
      log(d);
    } catch (e) { log(String(e)); }
  };

  const useLoginUser = () => {
    if (st.currentUserId) {
      $("to").value = st.currentUserId;
      log("已填充当前登录用户ID: " + st.currentUserId);
      return;
    }
    try {
      const raw = $("loginInfo").textContent || "";
      const data = raw ? JSON.parse(raw) : null;
      const uid = extractUserId(data);
      if (uid) {
        rememberUserId(uid);
        log("已从扫码会话信息提取用户ID: " + uid);
      } else {
        log("未找到用户ID，请先扫码并刷新状态/确认入库。");
      }
    } catch {
      log("当前会话信息不是有效JSON，无法提取用户ID。");
    }
  };

  const initLoginSession = async () => {
    // On first page load, auto-start QR login so the UI is not empty.
    if (!st.sessionId) {
      await startLogin();
      return;
    }
    const d = await statusLogin(true);
    // Existing session may be expired/removed; create a new one automatically.
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
  $("btnUseLoginUser").addEventListener("click", useLoginUser);
  $("btnSendTest").addEventListener("click", sendTest);

  loadConn();
  initLoginSession();
  listAccounts();
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
