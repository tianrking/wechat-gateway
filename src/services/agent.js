import { errMessage } from "../utils/common.js";

export function extractText(itemList) {
  if (!Array.isArray(itemList)) return "";
  for (const item of itemList) {
    if (item?.type === 1 && item?.text_item?.text) {
      return String(item.text_item.text).trim();
    }
  }
  return "";
}

function buildAgentRequest(agent, messages) {
  const body = {
    model: agent.model,
    messages,
  };
  if (agent.temperature !== undefined) body.temperature = agent.temperature;
  if (agent.maxTokens !== undefined) body.max_tokens = agent.maxTokens;
  return body;
}

export async function askAgent(agent, history, inputText) {
  const messages = [];
  if (agent.systemPrompt) messages.push({ role: "system", content: agent.systemPrompt });
  messages.push(...history);
  messages.push({ role: "user", content: inputText });

  const headers = {
    "content-type": "application/json",
    ...(agent.headers || {}),
  };
  if (agent.apiKey) headers.authorization = `Bearer ${agent.apiKey}`;

  const abort = new AbortController();
  const timeoutMs = Number(agent.timeoutMs || 60000);
  const timer = setTimeout(() => abort.abort(), timeoutMs);

  let res;
  try {
    res = await fetch(agent.endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify(buildAgentRequest(agent, messages)),
      signal: abort.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    throw new Error(`agent ${agent.id} network error: ${errMessage(err)}`);
  }

  clearTimeout(timer);
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`agent ${agent.id} http ${res.status}: ${text.slice(0, 500)}`);
  }

  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`agent ${agent.id} invalid json: ${text.slice(0, 200)}`);
  }

  const reply = data?.choices?.[0]?.message?.content || data?.output_text || data?.content?.[0]?.text || "";
  return String(reply || "(empty reply)");
}
