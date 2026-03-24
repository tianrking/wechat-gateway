import { Keys } from "../constants.js";
import { kvDelete, kvGetJson, kvListJson, kvPutJson } from "./kv.js";

function normalizeAgent(input) {
  return {
    id: String(input.id || "").trim(),
    endpoint: String(input.endpoint || "").trim(),
    model: String(input.model || "").trim(),
    apiKey: String(input.apiKey || ""),
    systemPrompt: String(input.systemPrompt || ""),
    headers: input.headers && typeof input.headers === "object" ? input.headers : {},
    temperature: Number.isFinite(input.temperature) ? Number(input.temperature) : undefined,
    maxTokens: Number.isFinite(input.maxTokens) ? Number(input.maxTokens) : undefined,
    timeoutMs: Number.isFinite(input.timeoutMs) ? Number(input.timeoutMs) : 60000,
    weight: Number.isFinite(input.weight) ? Number(input.weight) : 1,
    enabled: input.enabled !== false,
    updatedAt: Date.now(),
  };
}

export async function upsertAgent(kv, input) {
  const next = normalizeAgent(input);
  await kvPutJson(kv, Keys.agent(next.id), next);
  return next;
}

export async function getAgent(kv, agentId) {
  return kvGetJson(kv, Keys.agent(agentId));
}

export async function listAgents(kv) {
  return kvListJson(kv, "agent:");
}

export async function listEnabledAgents(kv) {
  const all = await listAgents(kv);
  return all.filter((a) => a.enabled !== false);
}

export async function deleteAgent(kv, agentId) {
  await kvDelete(kv, Keys.agent(agentId));
}
