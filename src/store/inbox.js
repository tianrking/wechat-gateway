import { Keys } from "../constants.js";
import { kvDelete, kvListJson, kvPutJson } from "./kv.js";

function normalizeInbound(input) {
  return {
    id: String(input.id || crypto.randomUUID()),
    accountId: String(input.accountId || "").trim(),
    userId: String(input.userId || "").trim(),
    text: String(input.text || ""),
    botId: String(input.botId || "").trim(),
    space: String(input.space || "default").trim(),
    contextToken: String(input.contextToken || ""),
    createdAt: Number(input.createdAt || Date.now()),
  };
}

export async function addInboundMessage(kv, input, keep = 200) {
  const item = normalizeInbound(input);
  await kvPutJson(kv, Keys.inbox(item.accountId, `${item.createdAt}:${item.id}`), item);

  const all = await kvListJson(kv, `inbox:${item.accountId}:`);
  if (all.length <= keep) return item;

  const sorted = all.sort((a, b) => Number(b.createdAt || 0) - Number(a.createdAt || 0));
  const stale = sorted.slice(keep);
  await Promise.all(stale.map((x) => kvDelete(kv, Keys.inbox(item.accountId, `${x.createdAt}:${x.id}`))));
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

