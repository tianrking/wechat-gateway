import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

function normalizeSpace(input) {
  const accountPool = Array.isArray(input.accountPool)
    ? input.accountPool.map((x) => String(x).trim()).filter(Boolean)
    : [];

  return {
    name: String(input.name || "").trim(),
    defaultAgentId: String(input.defaultAgentId || "").trim(),
    strategy: String(input.strategy || "sticky_weighted").trim(),
    accountPool,
    updatedAt: Date.now(),
    createdAt: Number(input.createdAt || Date.now()),
  };
}

export async function upsertSpace(kv, input) {
  const existing = await kvGetJson(kv, Keys.space(input.name));
  const next = normalizeSpace({ ...existing, ...input, createdAt: existing?.createdAt || Date.now() });
  await kvPutJson(kv, Keys.space(next.name), next);
  return next;
}

export async function getSpace(kv, name) {
  return kvGetJson(kv, Keys.space(name));
}

export async function listSpaces(kv) {
  return kvListJson(kv, "space:");
}

export async function deleteSpace(kv, name) {
  await kvDelete(kv, Keys.space(name));
}
