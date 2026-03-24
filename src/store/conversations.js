import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

export async function getConversation(kv, spaceName, userId, agentId) {
  return (await kvGetJson(kv, Keys.conv(spaceName, userId, agentId))) || [];
}

export async function setConversation(kv, spaceName, userId, agentId, messages) {
  const trimmed = messages.slice(-20);
  await kvPutJson(kv, Keys.conv(spaceName, userId, agentId), trimmed);
}

export async function clearConversation(kv, spaceName, userId, agentId) {
  await kvDelete(kv, Keys.conv(spaceName, userId, agentId));
}

export async function listConversations(kv, spaceName) {
  return kvListJson(kv, `conv:${spaceName}:`);
}
