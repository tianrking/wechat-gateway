export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...headers,
    },
  });
}

export async function readJson(request) {
  const text = await request.text();
  if (!text) return {};
  return JSON.parse(text);
}

export function randomId() {
  return crypto.randomUUID();
}

export function hash32(input) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function randomWechatUin() {
  const n = new Uint32Array(1);
  crypto.getRandomValues(n);
  return btoa(String(n[0] >>> 0));
}

export function errMessage(err) {
  return String(err?.message || err);
}
