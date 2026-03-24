import aesjs from "aes-js";

const DEFAULT_CDN_BASE_URL = "https://novac2c.cdn.weixin.qq.com/c2c";

function isEnabled(env) {
  return String(env?.ENABLE_MEDIA_ARCHIVE || "").toLowerCase() === "true";
}

function guessContentType(mediaType, fileName) {
  const name = String(fileName || "").toLowerCase();
  if (mediaType === "image") {
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".webp")) return "image/webp";
    return "image/jpeg";
  }
  if (mediaType === "video") return "video/mp4";
  if (mediaType === "voice") return "audio/silk";
  if (name.endsWith(".pdf")) return "application/pdf";
  if (name.endsWith(".txt")) return "text/plain; charset=utf-8";
  if (name.endsWith(".doc")) return "application/msword";
  if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (name.endsWith(".xls")) return "application/vnd.ms-excel";
  if (name.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  if (name.endsWith(".zip")) return "application/zip";
  return "application/octet-stream";
}

function parseAesKey(raw) {
  const input = String(raw || "").trim();
  if (!input) return null;
  if (/^[0-9a-fA-F]{32}$/.test(input)) {
    return hexToBytes(input);
  }
  const decoded = base64ToBytes(input);
  if (decoded.length === 16) return decoded;
  if (decoded.length === 32) {
    const ascii = bytesToAscii(decoded);
    if (/^[0-9a-fA-F]{32}$/.test(ascii)) {
      return hexToBytes(ascii);
    }
  }
  return null;
}

function stripPkcs7(buf) {
  if (!buf || !buf.length) return buf;
  const pad = buf[buf.length - 1];
  if (pad <= 0 || pad > 16 || pad > buf.length) return buf;
  for (let i = buf.length - pad; i < buf.length; i += 1) {
    if (buf[i] !== pad) return buf;
  }
  return buf.slice(0, buf.length - pad);
}

function decryptAesEcb(cipherBytes, keyBytes) {
  const ecb = new aesjs.ModeOfOperation.ecb(keyBytes);
  const out = ecb.decrypt(cipherBytes);
  return stripPkcs7(Uint8Array.from(out));
}

function buildDownloadUrl(cdnBaseUrl, encryptedQueryParam) {
  return `${cdnBaseUrl}/download?encrypted_query_param=${encodeURIComponent(encryptedQueryParam)}`;
}

function fileExtFromName(name, fallback = "bin") {
  const n = String(name || "");
  const idx = n.lastIndexOf(".");
  if (idx < 0 || idx === n.length - 1) return fallback;
  return n.slice(idx + 1).replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || fallback;
}

function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

function base64ToBytes(b64) {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) out[i] = s.charCodeAt(i);
  return out;
}

function bytesToAscii(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 1) s += String.fromCharCode(bytes[i]);
  return s;
}

function r2Key(accountId, mediaType, fileName) {
  const extFallback = mediaType === "image" ? "jpg" : mediaType === "video" ? "mp4" : "bin";
  const ext = fileExtFromName(fileName, extFallback);
  return `inbound/${accountId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
}

export async function maybeArchiveMediaToR2(env, account, mediaItem) {
  if (!isEnabled(env)) return { stored: false, reason: "archive disabled" };
  if (!env?.MEDIA_BUCKET) return { stored: false, reason: "MEDIA_BUCKET not configured" };

  const query = String(mediaItem?.encryptQueryParam || "").trim();
  const aesRaw = mediaItem?.aesKey;
  if (!query || !aesRaw) return { stored: false, reason: "missing media token/key" };

  const key = parseAesKey(aesRaw);
  if (!key) return { stored: false, reason: "invalid aes key format" };

  const cdnBaseUrl = String(env?.WECHAT_CDN_BASE_URL || account?.cdnBaseUrl || DEFAULT_CDN_BASE_URL).trim();
  const url = buildDownloadUrl(cdnBaseUrl, query);
  const res = await fetch(url);
  if (!res.ok) {
    return { stored: false, reason: `cdn download http ${res.status}` };
  }

  const cipher = new Uint8Array(await res.arrayBuffer());
  const plain = decryptAesEcb(cipher, key);
  const contentType = guessContentType(mediaItem.type, mediaItem.fileName);
  const objectKey = r2Key(account.accountId, mediaItem.type, mediaItem.fileName);

  await env.MEDIA_BUCKET.put(objectKey, plain, {
    httpMetadata: {
      contentType,
      contentDisposition: `attachment; filename="${String(mediaItem.fileName || objectKey).replaceAll("\"", "")}"`,
    },
  });

  return {
    stored: true,
    key: objectKey,
    contentType,
    size: plain.length,
  };
}
