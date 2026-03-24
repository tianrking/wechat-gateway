import { Msg } from "../constants.js";
import {
  clearConversation,
  getConversation,
  setConversation,
} from "../store/conversations.js";
import { getSpace } from "../store/spaces.js";
import { getBinding } from "../store/bindings.js";
import {
  getAccount,
  getContextToken,
  listAccounts,
  setContextToken,
  touchContact,
  upsertAccount,
} from "../store/accounts.js";
import { listEnabledAgents } from "../store/agents.js";
import { addInboundMessage } from "../store/inbox.js";
import { askAgent, extractText } from "./agent.js";
import { getTypingTicket, getUpdates, sendText, sendTyping } from "./ilink.js";
import { pickAgent } from "./router.js";

function defaultSpace(name) {
  return {
    name,
    defaultAgentId: "",
    strategy: "sticky_weighted",
  };
}

function extractInboundPayload(msg) {
  const items = Array.isArray(msg?.item_list) ? msg.item_list : [];
  const media = [];
  let text = "";

  for (const item of items) {
    if (!item || typeof item !== "object") continue;
    if (item.type === Msg.ITEM_TEXT && item.text_item?.text && !text) {
      text = String(item.text_item.text).trim();
      continue;
    }

    if (item.type === 2 && item.image_item?.media) {
      media.push({
        type: "image",
        fileName: item.image_item?.file_name || "",
        size: Number(item.image_item?.mid_size || 0) || undefined,
      });
      continue;
    }
    if (item.type === 3 && item.voice_item?.media) {
      media.push({
        type: "voice",
        size: Number(item.voice_item?.voice_size || 0) || undefined,
      });
      continue;
    }
    if (item.type === 4 && item.file_item?.media) {
      media.push({
        type: "file",
        fileName: item.file_item?.file_name || "",
        size: Number(item.file_item?.len || 0) || undefined,
      });
      continue;
    }
    if (item.type === 5 && item.video_item?.media) {
      media.push({
        type: "video",
        size: Number(item.video_item?.video_size || 0) || undefined,
      });
      continue;
    }
  }

  return { text, media };
}

async function processOneInbound(account, msg, env) {
  const userId = msg?.from_user_id;
  const payload = extractInboundPayload(msg);
  const text = payload.text || extractText(msg?.item_list);
  const media = payload.media || [];
  if (!userId || (!text && media.length === 0)) return { handled: false, reason: "empty" };
  const spaceName = account.space || "default";

  await touchContact(env.BOT_STATE, account.accountId, userId);
  await addInboundMessage(env.BOT_STATE, {
    accountId: account.accountId,
    userId,
    text,
    kind: media.length ? (text ? "mixed" : "media") : "text",
    media,
    botId: account.botId,
    space: spaceName,
    contextToken: msg?.context_token || "",
    createdAt: Date.now(),
  });

  if (msg?.context_token) {
    await setContextToken(env.BOT_STATE, account.accountId, userId, msg.context_token);
  }

  // For media-only inbound, record it and skip LLM reply generation.
  if (!text) {
    return { handled: true, reason: "media_only" };
  }

  const space = (await getSpace(env.BOT_STATE, spaceName)) || defaultSpace(spaceName);
  const binding = await getBinding(env.BOT_STATE, spaceName, userId);

  const allAgents = await listEnabledAgents(env.BOT_STATE);
  if (!allAgents.length) {
    await sendText(account, {
      toUserId: userId,
      text: "No enabled agent configured.",
      contextToken: msg.context_token || "",
      channelVersion: env.CHANNEL_VERSION,
    });
    return { handled: true, reason: "no_agent" };
  }

  const agent = pickAgent(space, binding?.agentId, userId, allAgents);
  if (!agent) {
    return { handled: false, reason: "agent_pick_failed" };
  }

  const typingTicket = await getTypingTicket(account, userId, msg.context_token || "");
  if (typingTicket) {
    await sendTyping(account, userId, typingTicket, Msg.TYPING, env.CHANNEL_VERSION);
  }

  const history = await getConversation(env.BOT_STATE, spaceName, userId, agent.id);
  const reply = await askAgent(agent, history, text);

  const nextHistory = [
    ...history,
    { role: "user", content: text },
    { role: "assistant", content: reply },
  ].slice(-20);
  await setConversation(env.BOT_STATE, spaceName, userId, agent.id, nextHistory);

  const contextToken = msg.context_token || (await getContextToken(env.BOT_STATE, account.accountId, userId));

  if (typingTicket) {
    await sendTyping(account, userId, typingTicket, Msg.TYPING_CANCEL, env.CHANNEL_VERSION);
  }

  await sendText(account, {
    toUserId: userId,
    text: reply,
    contextToken,
    channelVersion: env.CHANNEL_VERSION,
  });

  return { handled: true, agentId: agent.id };
}

export async function pollAccount(account, env) {
  const start = Date.now();
  try {
    const updates = await getUpdates(account, env.CHANNEL_VERSION || "cf-wechat-worker");

    if (updates?.errcode === -14) {
      const disabled = await upsertAccount(env.BOT_STATE, {
        ...account,
        enabled: false,
      });
      return {
        accountId: account.accountId,
        ok: false,
        reason: "session expired (-14)",
        disabled: Boolean(disabled),
      };
    }

    if (typeof updates?.get_updates_buf === "string") {
      account.syncBuf = updates.get_updates_buf;
      await upsertAccount(env.BOT_STATE, account);
    }

    const msgs = Array.isArray(updates?.msgs) ? updates.msgs : [];
    let handled = 0;

    for (const msg of msgs) {
      if (msg?.message_type !== Msg.TYPE_USER || msg?.message_state !== Msg.STATE_FINISH) continue;
      await processOneInbound(account, msg, env);
      handled += 1;
    }

    return {
      accountId: account.accountId,
      ok: true,
      polled: msgs.length,
      handled,
      elapsedMs: Date.now() - start,
    };
  } catch (err) {
    return {
      accountId: account.accountId,
      ok: false,
      error: String(err?.message || err),
      elapsedMs: Date.now() - start,
    };
  }
}

export async function runPollCycle(env, onlyAccountId) {
  const all = await listAccounts(env.BOT_STATE);
  const targets = all.filter((a) => a.enabled && (!onlyAccountId || a.accountId === onlyAccountId));
  return Promise.all(targets.map((account) => pollAccount(account, env)));
}

export async function sendByAccount(env, payload) {
  const account = await getAccount(env.BOT_STATE, payload.accountId);
  if (!account) {
    return { ok: false, error: "account not found" };
  }

  const contextToken = payload.contextToken || (await getContextToken(env.BOT_STATE, payload.accountId, payload.to));
  await sendText(account, {
    toUserId: payload.to,
    text: payload.text,
    contextToken,
    channelVersion: env.CHANNEL_VERSION,
  });

  return { ok: true };
}

export async function clearUserConversation(env, payload) {
  await clearConversation(env.BOT_STATE, payload.space, payload.userId, payload.agentId);
  return { ok: true };
}
