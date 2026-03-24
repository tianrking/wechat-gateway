import {
  getAccount,
  getContextToken,
  listAccounts,
  listContacts,
  touchContact,
} from "../store/accounts.js";
import { clearInboundMessages, listInboundMessages } from "../store/inbox.js";
import { sendText } from "../services/ilink.js";
import { hash32, json, readJson } from "../utils/common.js";

function pickAccount(accounts, to, preferredId) {
  if (preferredId) {
    return accounts.find((a) => a.accountId === preferredId) || null;
  }
  const enabled = accounts.filter((a) => a.enabled);
  if (!enabled.length) return null;
  const i = hash32(String(to || "")) % enabled.length;
  return enabled[i];
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const body = request.method === "GET" || request.method === "DELETE" ? {} : await readJson(request);

  try {
    if (request.method === "GET" && url.pathname === "/api/accounts") {
      const items = await listAccounts(env.BOT_STATE);
      return json({
        ok: true,
        items: items.map((a) => ({
          accountId: a.accountId,
          botId: a.botId,
          baseUrl: a.baseUrl,
          space: a.space,
          enabled: a.enabled,
          updatedAt: a.updatedAt,
        })),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/contacts") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const limitRaw = Number(url.searchParams.get("limit") || 50);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
      const items = await listContacts(env.BOT_STATE, accountId || undefined);
      return json({
        ok: true,
        items: items.slice(0, limit).map((x) => ({
          accountId: x.accountId,
          userId: x.userId,
          updatedAt: x.updatedAt,
        })),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/inbox") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const limitRaw = Number(url.searchParams.get("limit") || 100);
      const items = await listInboundMessages(env.BOT_STATE, accountId || undefined, limitRaw);
      return json({
        ok: true,
        items: items.map((x) => ({
          id: x.id,
          accountId: x.accountId,
          userId: x.userId,
          text: x.text,
          kind: x.kind || "text",
          media: Array.isArray(x.media) ? x.media : [],
          botId: x.botId,
          space: x.space,
          createdAt: x.createdAt,
        })),
      });
    }

    if (request.method === "DELETE" && url.pathname === "/api/inbox") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const deleted = await clearInboundMessages(env.BOT_STATE, accountId || undefined);
      return json({ ok: true, deleted, accountId: accountId || null });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/accounts/")) {
      const accountId = url.pathname.split("/").at(-1);
      const account = await getAccount(env.BOT_STATE, accountId);
      if (!account) return json({ ok: false, error: "account not found" }, 404);
      await env.BOT_STATE.delete(`account:${accountId}`);
      return json({ ok: true, deleted: accountId });
    }

    if (request.method === "POST" && url.pathname === "/api/send") {
      if (!body.to || !body.text) {
        return json({ ok: false, error: "missing to/text" }, 400);
      }

      const accounts = await listAccounts(env.BOT_STATE);
      const selected = pickAccount(accounts, body.to, body.accountId);
      if (!selected) {
        return json({ ok: false, error: "no enabled account available" }, 409);
      }

      const contextToken = body.contextToken || (await getContextToken(env.BOT_STATE, selected.accountId, body.to));
      const upstream = await sendText(selected, {
        toUserId: body.to,
        text: String(body.text),
        contextToken,
        channelVersion: env.CHANNEL_VERSION,
      });
      await touchContact(env.BOT_STATE, selected.accountId, body.to);

      return json({
        ok: true,
        accountId: selected.accountId,
        to: body.to,
        upstream,
      });
    }

    return json({ ok: false, error: "not found" }, 404);
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
}
