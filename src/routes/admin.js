import { ILinkDefaults } from "../constants.js";
import { upsertAccount, listAccounts, getAccount, deleteAccount, setAccountEnabled, setAccountSpace, resetAccountSync, clearAccountContexts } from "../store/accounts.js";
import { upsertAgent, listAgents, getAgent, deleteAgent } from "../store/agents.js";
import { upsertSpace, listSpaces, getSpace, deleteSpace } from "../store/spaces.js";
import { setBinding, getBinding, listBindings, removeBinding } from "../store/bindings.js";
import { listConversations } from "../store/conversations.js";
import { createLoginSession, deleteLoginSession, getLoginSession, updateLoginSession } from "../store/logins.js";
import { getQrCode, getQrStatus } from "../services/ilink.js";
import { clearUserConversation, runPollCycle, sendByAccount } from "../services/poller.js";
import { json, readJson } from "../utils/common.js";

function normalizeAccountId(raw) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function handleAdmin(request, env) {
  const url = new URL(request.url);
  const body = request.method === "GET" || request.method === "DELETE" ? {} : await readJson(request);

  if (request.method === "GET" && url.pathname === "/admin/overview") {
    const [accounts, agents, spaces] = await Promise.all([
      listAccounts(env.BOT_STATE),
      listAgents(env.BOT_STATE),
      listSpaces(env.BOT_STATE),
    ]);
    return json({
      ok: true,
      totals: {
        accounts: accounts.length,
        enabledAccounts: accounts.filter((x) => x.enabled).length,
        agents: agents.length,
        enabledAgents: agents.filter((x) => x.enabled !== false).length,
        spaces: spaces.length,
      },
      time: new Date().toISOString(),
    });
  }

  if (request.method === "POST" && url.pathname === "/admin/login/start") {
    const baseUrl = body.baseUrl || ILinkDefaults.baseUrl;
    const botType = body.botType || ILinkDefaults.botType;
    const qr = await getQrCode(baseUrl, botType);

    const session = await createLoginSession(env.BOT_STATE, {
      baseUrl,
      qrcode: qr.qrcode,
      qrcodeImg: qr.qrcode_img_content,
      accountIdHint: body.accountIdHint || "",
    });

    return json({
      ok: true,
      sessionId: session.sessionId,
      baseUrl,
      qrcode: qr.qrcode,
      qrcode_img_content: qr.qrcode_img_content,
    });
  }

  if (request.method === "GET" && url.pathname === "/admin/login/status") {
    const sessionId = url.searchParams.get("sessionId") || body.sessionId;
    if (!sessionId) return json({ ok: false, error: "missing sessionId" }, 400);

    const session = await getLoginSession(env.BOT_STATE, sessionId);
    if (!session) return json({ ok: false, error: "session not found or expired" }, 404);

    const status = await getQrStatus(session.baseUrl, session.qrcode);
    const patched = await updateLoginSession(env.BOT_STATE, sessionId, {
      status: status.status,
      rawStatus: status,
    });

    return json({ ok: true, session: patched, status });
  }

  if (request.method === "POST" && url.pathname === "/admin/login/confirm") {
    const sessionId = body.sessionId;
    if (!sessionId) return json({ ok: false, error: "missing sessionId" }, 400);

    const session = await getLoginSession(env.BOT_STATE, sessionId);
    if (!session) return json({ ok: false, error: "session not found or expired" }, 404);

    const status = await getQrStatus(session.baseUrl, session.qrcode);
    if (status.status !== "confirmed" || !status.bot_token || !status.ilink_bot_id) {
      return json({
        ok: false,
        error: "login not confirmed",
        status,
      }, 409);
    }

    const accountId = normalizeAccountId(body.accountId || session.accountIdHint || status.ilink_bot_id);
    const record = await upsertAccount(env.BOT_STATE, {
      accountId,
      botToken: status.bot_token,
      botId: status.ilink_bot_id,
      baseUrl: status.baseurl || session.baseUrl || ILinkDefaults.baseUrl,
      space: body.space || "default",
      enabled: true,
    });

    await deleteLoginSession(env.BOT_STATE, sessionId);
    return json({ ok: true, account: record, loginStatus: status });
  }

  if (request.method === "POST" && url.pathname === "/admin/accounts/upsert") {
    const required = ["accountId", "botToken", "botId"];
    for (const name of required) {
      if (!body[name]) return json({ ok: false, error: `missing ${name}` }, 400);
    }
    const account = await upsertAccount(env.BOT_STATE, body);
    return json({ ok: true, account });
  }

  if (request.method === "GET" && url.pathname === "/admin/accounts") {
    return json({ ok: true, items: await listAccounts(env.BOT_STATE) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/admin/accounts/")) {
    const accountId = url.pathname.split("/").at(-1);
    const item = await getAccount(env.BOT_STATE, accountId);
    if (!item) return json({ ok: false, error: "account not found" }, 404);
    return json({ ok: true, account: item });
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/admin/accounts/")) {
    const accountId = url.pathname.split("/").at(-1);
    await deleteAccount(env.BOT_STATE, accountId);
    const ctxDeleted = await clearAccountContexts(env.BOT_STATE, accountId);
    return json({ ok: true, deleted: accountId, deletedContexts: ctxDeleted });
  }

  if (request.method === "POST" && url.pathname === "/admin/accounts/set-enabled") {
    if (!body.accountId) return json({ ok: false, error: "missing accountId" }, 400);
    const account = await setAccountEnabled(env.BOT_STATE, body.accountId, body.enabled);
    if (!account) return json({ ok: false, error: "account not found" }, 404);
    return json({ ok: true, account });
  }

  if (request.method === "POST" && url.pathname === "/admin/accounts/set-space") {
    if (!body.accountId || !body.space) return json({ ok: false, error: "missing accountId/space" }, 400);
    const account = await setAccountSpace(env.BOT_STATE, body.accountId, body.space);
    if (!account) return json({ ok: false, error: "account not found" }, 404);
    return json({ ok: true, account });
  }

  if (request.method === "POST" && url.pathname === "/admin/accounts/reset-sync") {
    if (!body.accountId) return json({ ok: false, error: "missing accountId" }, 400);
    const account = await resetAccountSync(env.BOT_STATE, body.accountId);
    if (!account) return json({ ok: false, error: "account not found" }, 404);
    return json({ ok: true, account });
  }

  if (request.method === "POST" && url.pathname === "/admin/agents/upsert") {
    const required = ["id", "endpoint", "model"];
    for (const name of required) {
      if (!body[name]) return json({ ok: false, error: `missing ${name}` }, 400);
    }
    const agent = await upsertAgent(env.BOT_STATE, body);
    return json({ ok: true, agent });
  }

  if (request.method === "GET" && url.pathname === "/admin/agents") {
    return json({ ok: true, items: await listAgents(env.BOT_STATE) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/admin/agents/")) {
    const id = url.pathname.split("/").at(-1);
    const agent = await getAgent(env.BOT_STATE, id);
    if (!agent) return json({ ok: false, error: "agent not found" }, 404);
    return json({ ok: true, agent });
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/admin/agents/")) {
    const id = url.pathname.split("/").at(-1);
    await deleteAgent(env.BOT_STATE, id);
    return json({ ok: true, deleted: id });
  }

  if (request.method === "POST" && url.pathname === "/admin/spaces/upsert") {
    if (!body.name || !body.defaultAgentId) {
      return json({ ok: false, error: "missing name/defaultAgentId" }, 400);
    }
    const space = await upsertSpace(env.BOT_STATE, body);
    return json({ ok: true, space });
  }

  if (request.method === "GET" && url.pathname === "/admin/spaces") {
    return json({ ok: true, items: await listSpaces(env.BOT_STATE) });
  }

  if (request.method === "GET" && url.pathname.startsWith("/admin/spaces/")) {
    const name = url.pathname.split("/").at(-1);
    const space = await getSpace(env.BOT_STATE, name);
    if (!space) return json({ ok: false, error: "space not found" }, 404);
    return json({ ok: true, space });
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/admin/spaces/")) {
    const name = url.pathname.split("/").at(-1);
    await deleteSpace(env.BOT_STATE, name);
    return json({ ok: true, deleted: name });
  }

  if (request.method === "POST" && url.pathname === "/admin/bind/upsert") {
    if (!body.space || !body.userId || !body.agentId) {
      return json({ ok: false, error: "missing space/userId/agentId" }, 400);
    }
    const binding = await setBinding(env.BOT_STATE, body.space, body.userId, body.agentId);
    return json({ ok: true, binding });
  }

  if (request.method === "GET" && url.pathname === "/admin/bind/get") {
    const space = url.searchParams.get("space");
    const userId = url.searchParams.get("userId");
    if (!space || !userId) return json({ ok: false, error: "missing space/userId" }, 400);
    const binding = await getBinding(env.BOT_STATE, space, userId);
    return json({ ok: true, binding });
  }

  if (request.method === "GET" && url.pathname === "/admin/bind/list") {
    const space = url.searchParams.get("space");
    if (!space) return json({ ok: false, error: "missing space" }, 400);
    return json({ ok: true, items: await listBindings(env.BOT_STATE, space) });
  }

  if (request.method === "DELETE" && url.pathname === "/admin/bind/remove") {
    const space = url.searchParams.get("space");
    const userId = url.searchParams.get("userId");
    if (!space || !userId) return json({ ok: false, error: "missing space/userId" }, 400);
    await removeBinding(env.BOT_STATE, space, userId);
    return json({ ok: true });
  }

  if (request.method === "GET" && url.pathname === "/admin/conversations") {
    const space = url.searchParams.get("space");
    if (!space) return json({ ok: false, error: "missing space" }, 400);
    return json({ ok: true, items: await listConversations(env.BOT_STATE, space) });
  }

  if (request.method === "POST" && url.pathname === "/admin/conversations/clear") {
    const required = ["space", "userId", "agentId"];
    for (const name of required) {
      if (!body[name]) return json({ ok: false, error: `missing ${name}` }, 400);
    }
    return json(await clearUserConversation(env, body));
  }

  if (request.method === "POST" && url.pathname === "/admin/poll") {
    const results = await runPollCycle(env, body.accountId || null);
    return json({ ok: true, results });
  }

  if (request.method === "POST" && url.pathname === "/admin/send") {
    const required = ["accountId", "to", "text"];
    for (const name of required) {
      if (!body[name]) return json({ ok: false, error: `missing ${name}` }, 400);
    }
    const result = await sendByAccount(env, body);
    if (!result.ok) return json(result, 404);
    return json(result);
  }

  return json({ ok: false, error: "not found" }, 404);
}
