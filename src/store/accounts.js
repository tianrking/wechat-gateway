import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

function normalizeAccount(input) {
  return {
    accountId: String(input.accountId || "").trim(),
    botToken: String(input.botToken || "").trim(),
    botId: String(input.botId || "").trim(),
    baseUrl: String(input.baseUrl || "").trim(),
    space: String(input.space || "default").trim(),
    enabled: input.enabled !== false,
    syncBuf: String(input.syncBuf || ""),
    updatedAt: Date.now(),
    createdAt: Number(input.createdAt || Date.now()),
  };
}

export async function upsertAccount(kv, input) {
  const existing = await kvGetJson(kv, Keys.account(input.accountId));
  const next = normalizeAccount({ ...existing, ...input, createdAt: existing?.createdAt || Date.now() });
  await kvPutJson(kv, Keys.account(next.accountId), next);
  return next;
}

export async function getAccount(kv, accountId) {
  return kvGetJson(kv, Keys.account(accountId));
}

export async function listAccounts(kv) {
  return kvListJson(kv, "account:");
}

export async function deleteAccount(kv, accountId) {
  await kvDelete(kv, Keys.account(accountId));
}

export async function setAccountEnabled(kv, accountId, enabled) {
  const account = await getAccount(kv, accountId);
  if (!account) return null;
  account.enabled = Boolean(enabled);
  account.updatedAt = Date.now();
  await kvPutJson(kv, Keys.account(accountId), account);
  return account;
}

export async function setAccountSpace(kv, accountId, space) {
  const account = await getAccount(kv, accountId);
  if (!account) return null;
  account.space = space;
  account.updatedAt = Date.now();
  await kvPutJson(kv, Keys.account(accountId), account);
  return account;
}

export async function resetAccountSync(kv, accountId) {
  const account = await getAccount(kv, accountId);
  if (!account) return null;
  account.syncBuf = "";
  account.updatedAt = Date.now();
  await kvPutJson(kv, Keys.account(accountId), account);
  return account;
}

export async function setContextToken(kv, accountId, userId, contextToken) {
  await kvPutJson(kv, Keys.ctx(accountId, userId), {
    accountId,
    userId,
    contextToken,
    updatedAt: Date.now(),
  });
}

export async function getContextToken(kv, accountId, userId) {
  const ctx = await kvGetJson(kv, Keys.ctx(accountId, userId));
  return ctx?.contextToken || "";
}

export async function clearAccountContexts(kv, accountId) {
  const all = await kvListJson(kv, `ctx:${accountId}:`);
  await Promise.all(all.map((v) => kvDelete(kv, Keys.ctx(accountId, v.userId))));
  return all.length;
}
