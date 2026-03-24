import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvPutJson } from "./kv.js";

const LOGIN_TTL_SEC = 10 * 60;

export async function createLoginSession(kv, data) {
  const sessionId = crypto.randomUUID();
  const record = {
    sessionId,
    baseUrl: data.baseUrl,
    qrcode: data.qrcode,
    qrcodeImg: data.qrcodeImg,
    status: "wait",
    accountIdHint: data.accountIdHint || "",
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await kvPutJson(kv, Keys.login(sessionId), record, { expirationTtl: LOGIN_TTL_SEC });
  return record;
}

export async function getLoginSession(kv, sessionId) {
  return kvGetJson(kv, Keys.login(sessionId));
}

export async function updateLoginSession(kv, sessionId, patch) {
  const current = await getLoginSession(kv, sessionId);
  if (!current) return null;
  const next = { ...current, ...patch, updatedAt: Date.now() };
  await kvPutJson(kv, Keys.login(sessionId), next, { expirationTtl: LOGIN_TTL_SEC });
  return next;
}

export async function deleteLoginSession(kv, sessionId) {
  await kvDelete(kv, Keys.login(sessionId));
}
