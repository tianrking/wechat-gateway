export const ILinkDefaults = {
  baseUrl: "https://ilinkai.weixin.qq.com",
  qrCodePath: "/ilink/bot/get_bot_qrcode?bot_type=3",
  qrStatusPath: "/ilink/bot/get_qrcode_status?qrcode=",
  botType: "3",
};

export const Msg = {
  TYPE_USER: 1,
  TYPE_BOT: 2,
  STATE_FINISH: 2,
  ITEM_TEXT: 1,
  TYPING: 1,
  TYPING_CANCEL: 2,
};

export const Keys = {
  account: (accountId) => `account:${accountId}`,
  agent: (agentId) => `agent:${agentId}`,
  space: (spaceName) => `space:${spaceName}`,
  bind: (spaceName, userId) => `bind:${spaceName}:${userId}`,
  conv: (spaceName, userId, agentId) => `conv:${spaceName}:${userId}:${agentId}`,
  ctx: (accountId, userId) => `ctx:${accountId}:${userId}`,
  contact: (accountId, userId) => `contact:${accountId}:${userId}`,
  login: (sessionId) => `login:${sessionId}`,
};
