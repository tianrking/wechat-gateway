import { ILinkDefaults, Msg } from "../constants.js";
import { errMessage, randomId, randomWechatUin } from "../utils/common.js";

async function readJsonResponse(res, label) {
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${label} http ${res.status}: ${text.slice(0, 300)}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} returned invalid json: ${text.slice(0, 160)}`);
  }
}

export async function getQrCode(baseUrl = ILinkDefaults.baseUrl, botType = ILinkDefaults.botType) {
  const url = `${baseUrl}${ILinkDefaults.qrCodePath.replace("3", encodeURIComponent(botType))}`;
  const res = await fetch(url, { method: "GET" });
  return readJsonResponse(res, "get_bot_qrcode");
}

export async function getQrStatus(baseUrl = ILinkDefaults.baseUrl, qrcode) {
  const url = `${baseUrl}${ILinkDefaults.qrStatusPath}${encodeURIComponent(qrcode)}`;
  const res = await fetch(url, { method: "GET" });
  return readJsonResponse(res, "get_qrcode_status");
}

export async function ilinkPost(account, path, body) {
  const baseUrl = account.baseUrl || ILinkDefaults.baseUrl;
  const res = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      AuthorizationType: "ilink_bot_token",
      Authorization: `Bearer ${account.botToken}`,
      "X-WECHAT-UIN": randomWechatUin(),
    },
    body: JSON.stringify(body),
  });

  const data = await readJsonResponse(res, `ilink ${path}`);
  if (data?.ret && data.ret !== 0 && data?.errcode !== -14) {
    throw new Error(`ilink ${path} api ret=${data.ret} err=${data.errmsg || ""}`);
  }
  return data;
}

export async function getUpdates(account, channelVersion) {
  return ilinkPost(account, "/ilink/bot/getupdates", {
    get_updates_buf: account.syncBuf || "",
    base_info: { channel_version: channelVersion },
  });
}

export async function getTypingTicket(account, userId, contextToken) {
  try {
    const cfg = await ilinkPost(account, "/ilink/bot/getconfig", {
      ilink_user_id: userId,
      context_token: contextToken || "",
      base_info: {},
    });
    return cfg?.typing_ticket || "";
  } catch {
    return "";
  }
}

export async function sendTyping(account, userId, typingTicket, status, channelVersion) {
  try {
    await ilinkPost(account, "/ilink/bot/sendtyping", {
      ilink_user_id: userId,
      typing_ticket: typingTicket,
      status,
      base_info: { channel_version: channelVersion },
    });
  } catch (err) {
    console.warn("sendTyping failed", errMessage(err));
  }
}

export async function sendText(account, payload) {
  const clientId = payload.clientId || randomId();
  return ilinkPost(account, "/ilink/bot/sendmessage", {
    msg: {
      from_user_id: account.botId,
      to_user_id: payload.toUserId,
      client_id: clientId,
      message_type: Msg.TYPE_BOT,
      message_state: Msg.STATE_FINISH,
      context_token: payload.contextToken || "",
      item_list: [
        {
          type: Msg.ITEM_TEXT,
          text_item: { text: payload.text },
        },
      ],
    },
    base_info: { channel_version: payload.channelVersion },
  });
}
