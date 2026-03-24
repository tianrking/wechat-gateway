import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

function normalizeInbound(input) {
  return {
    id: String(input.id || crypto.randomUUID()),
    accountId: String(input.accountId || "").trim(),
    userId: String(input.userId || "").trim(),
    text: String(input.text || ""),
    kind: String(input.kind || "text"),
    media: Array.isArray(input.media) ? input.media : [],
    botId: String(input.botId || "").trim(),
    space: String(input.space || "default").trim(),
    contextToken: String(input.contextToken || ""),
    createdAt: Number(input.createdAt || Date.now()),
  };
}

export async function addInboundMessage(kv, input, keep = 200) {
  const item = normalizeInbound(input);
  await kvPutJson(kv, Keys.inbox(item.accountId, `${item.createdAt}:${item.id}`), item);
  // Hot-path cost guard: avoid KV.list() on every inbound message.
  // Retention cleanup can be done manually via /api/inbox DELETE when needed.
  void keep;
  return item;
}

export async function listInboundMessages(kv, accountId, limit = 100) {
  const safeLimit = Math.max(1, Math.min(500, Number(limit) || 100));
  const prefix = accountId ? `inbox:${accountId}:` : "inbox:";
  const all = await kvListJson(kv, prefix);
  return all.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0)).slice(0, safeLimit);
}

export async function clearInboundMessages(kv, accountId) {
  const prefix = accountId ? `inbox:${accountId}:` : "inbox:";
  const all = await kvListJson(kv, prefix);
  await Promise.all(
    all.map((x) => kvDelete(kv, Keys.inbox(x.accountId, `${x.createdAt}:${x.id}`))),
  );
  return all.length;
}

async function findInboxEntry(kv, accountId, id, createdAt) {
  if (createdAt) {
    const key = Keys.inbox(accountId, `${createdAt}:${id}`);
    const item = await kvGetJson(kv, key);
    return item ? { key, item } : null;
  }

  const suffix = `:${id}`;
  const prefix = `inbox:${accountId}:`;
  let cursor = undefined;
  do {
    const page = await kv.list({ prefix, cursor });
    cursor = page.list_complete ? undefined : page.cursor;
    for (const entry of page.keys) {
      if (!entry.name.endsWith(suffix)) continue;
      const item = await kvGetJson(kv, entry.name);
      if (item) return { key: entry.name, item };
    }
  } while (cursor);
  return null;
}

export async function deleteInboundMessage(kv, accountId, id, createdAt) {
  const found = await findInboxEntry(kv, accountId, id, createdAt);
  if (!found) return null;
  await kvDelete(kv, found.key);
  return found.item;
}
