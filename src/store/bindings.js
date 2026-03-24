import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

export async function setBinding(kv, space, userId, agentId) {
  const bind = { space, userId, agentId, updatedAt: Date.now() };
  await kvPutJson(kv, Keys.bind(space, userId), bind);
  return bind;
}

export async function getBinding(kv, space, userId) {
  return kvGetJson(kv, Keys.bind(space, userId));
}

export async function listBindings(kv, space) {
  return kvListJson(kv, `bind:${space}:`);
}

export async function removeBinding(kv, space, userId) {
  await kvDelete(kv, Keys.bind(space, userId));
}
