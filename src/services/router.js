import { hash32 } from "../utils/common.js";

export function pickAgent(space, forcedAgentId, userId, allAgents) {
  if (forcedAgentId) {
    return allAgents.find((a) => a.id === forcedAgentId) || null;
  }

  const candidates = allAgents;
  if (candidates.length === 0) return null;

  if (space?.defaultAgentId) {
    const hasDefault = candidates.find((a) => a.id === space.defaultAgentId);
    if (!hasDefault && space.strategy === "default_only") {
      return candidates[0];
    }
  }

  if (space?.strategy === "default_only") {
    return candidates.find((a) => a.id === space.defaultAgentId) || candidates[0];
  }

  if (space?.strategy === "hash") {
    const h = hash32(`${space.name}:${userId}`);
    return candidates[h % candidates.length];
  }

  let best = null;
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const agent of candidates) {
    const weight = Math.max(0.0001, Number(agent.weight) || 1);
    const u = (hash32(`${space?.name || "default"}:${userId}:${agent.id}`) + 1) / 4294967296;
    const score = Math.log(u) / weight;
    if (score > bestScore) {
      bestScore = score;
      best = agent;
    }
  }

  return best || candidates[0];
}
