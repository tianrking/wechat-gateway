import {
  getAccount,
  getContextToken,
  listAccounts,
  listContacts,
  touchContact,
} from "../store/accounts.js";
import { clearInboundMessages, listInboundMessages } from "../store/inbox.js";
import { sendText } from "../services/ilink.js";
import { hash32, json, readJson } from "../utils/common.js";

function mediaFallbackName(m) {
  const type = String(m?.type || "media");
  if (type === "image") return "image.jpg";
  if (type === "video") return "video.mp4";
  if (type === "voice") return "voice.silk";
  if (type === "file") return "file.bin";
  return "media.bin";
}

const CONTENT_TYPE_EXT = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/bmp": "bmp",
  "image/tiff": "tiff",
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/x-msvideo": "avi",
  "video/x-matroska": "mkv",
  "audio/silk": "silk",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/ogg": "ogg",
  "audio/aac": "aac",
  "application/pdf": "pdf",
  "application/zip": "zip",
  "application/x-zip-compressed": "zip",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
  "application/vnd.ms-powerpoint": "ppt",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "pptx",
  "text/plain": "txt",
  "text/csv": "csv",
  "application/json": "json",
};

function sanitizeFilename(raw) {
  const base = String(raw || "").trim().replaceAll("\\", "/").split("/").pop() || "";
  const cleaned = base.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
  return cleaned.slice(0, 180);
}

function hasExt(name) {
  const n = String(name || "");
  const idx = n.lastIndexOf(".");
  return idx > 0 && idx < n.length - 1;
}

function extFromContentType(contentType) {
  const ct = String(contentType || "").toLowerCase().split(";")[0].trim();
  return CONTENT_TYPE_EXT[ct] || "";
}

function extFromType(type) {
  const t = String(type || "").toLowerCase();
  if (t === "image") return "jpg";
  if (t === "video") return "mp4";
  if (t === "voice") return "silk";
  if (t === "file") return "bin";
  return "bin";
}

function buildDownloadName(m) {
  const byName = sanitizeFilename(m.fileName);
  const byKey = sanitizeFilename(String(m.r2Key || "").split("/").pop());
  const base = byName || byKey || mediaFallbackName(m);
  if (hasExt(base)) return base;
  const ext = extFromContentType(m.contentType) || extFromType(m.type);
  return `${base}.${ext}`;
}

function pickAccount(accounts, to, preferredId) {
  if (preferredId) {
    return accounts.find((a) => a.accountId === preferredId) || null;
  }
  const enabled = accounts.filter((a) => a.enabled);
  if (!enabled.length) return null;
  const i = hash32(String(to || "")) % enabled.length;
  return enabled[i];
}

export async function handleApi(request, env) {
  const url = new URL(request.url);
  const body = request.method === "GET" || request.method === "DELETE" ? {} : await readJson(request);

  try {
    if (request.method === "GET" && url.pathname === "/api/accounts") {
      const items = await listAccounts(env.BOT_STATE);
      return json({
        ok: true,
        items: items.map((a) => ({
          accountId: a.accountId,
          botId: a.botId,
          baseUrl: a.baseUrl,
          space: a.space,
          enabled: a.enabled,
          updatedAt: a.updatedAt,
        })),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/contacts") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const limitRaw = Number(url.searchParams.get("limit") || 50);
      const limit = Number.isFinite(limitRaw) ? Math.max(1, Math.min(200, Math.floor(limitRaw))) : 50;
      const items = await listContacts(env.BOT_STATE, accountId || undefined);
      return json({
        ok: true,
        items: items.slice(0, limit).map((x) => ({
          accountId: x.accountId,
          userId: x.userId,
          updatedAt: x.updatedAt,
        })),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/inbox") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const limitRaw = Number(url.searchParams.get("limit") || 100);
      const items = await listInboundMessages(env.BOT_STATE, accountId || undefined, limitRaw);
      return json({
        ok: true,
        items: items.map((x) => ({
          id: x.id,
          accountId: x.accountId,
          userId: x.userId,
          text: x.text,
          kind: x.kind || "text",
          media: Array.isArray(x.media) ? x.media.map((m) => ({
            type: m.type,
            fileName: m.fileName || "",
            size: m.size,
            archived: m.archived === true,
            contentType: m.contentType || "",
            downloadName: buildDownloadName(m),
            downloadPath: m.archived && m.r2Key
              ? `/api/inbox/media?accountId=${encodeURIComponent(x.accountId)}&key=${encodeURIComponent(m.r2Key)}`
              : "",
            archiveReason: m.archiveReason || "",
          })) : [],
          botId: x.botId,
          space: x.space,
          createdAt: x.createdAt,
        })),
      });
    }

    if (request.method === "GET" && url.pathname === "/api/inbox/media") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const key = String(url.searchParams.get("key") || "").trim();
      if (!accountId || !key) {
        return json({ ok: false, error: "missing accountId/key" }, 400);
      }
      if (!key.startsWith(`inbound/${accountId}/`)) {
        return json({ ok: false, error: "forbidden key/account mismatch" }, 403);
      }
      if (!env.MEDIA_BUCKET) {
        return json({ ok: false, error: "MEDIA_BUCKET not configured" }, 409);
      }
      const obj = await env.MEDIA_BUCKET.get(key);
      if (!obj) return json({ ok: false, error: "media not found" }, 404);
      const headers = new Headers();
      obj.writeHttpMetadata(headers);
      headers.set("cache-control", "private, max-age=60");
      return new Response(obj.body, { status: 200, headers });
    }

    if (request.method === "DELETE" && url.pathname === "/api/inbox") {
      const accountId = String(url.searchParams.get("accountId") || "").trim();
      const deleted = await clearInboundMessages(env.BOT_STATE, accountId || undefined);
      return json({ ok: true, deleted, accountId: accountId || null });
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/accounts/")) {
      const accountId = url.pathname.split("/").at(-1);
      const account = await getAccount(env.BOT_STATE, accountId);
      if (!account) return json({ ok: false, error: "account not found" }, 404);
      await env.BOT_STATE.delete(`account:${accountId}`);
      return json({ ok: true, deleted: accountId });
    }

    if (request.method === "POST" && url.pathname === "/api/send") {
      if (!body.to || !body.text) {
        return json({ ok: false, error: "missing to/text" }, 400);
      }

      const accounts = await listAccounts(env.BOT_STATE);
      const selected = pickAccount(accounts, body.to, body.accountId);
      if (!selected) {
        return json({ ok: false, error: "no enabled account available" }, 409);
      }

      const contextToken = body.contextToken || (await getContextToken(env.BOT_STATE, selected.accountId, body.to));
      const upstream = await sendText(selected, {
        toUserId: body.to,
        text: String(body.text),
        contextToken,
        channelVersion: env.CHANNEL_VERSION,
      });
      await touchContact(env.BOT_STATE, selected.accountId, body.to);

      return json({
        ok: true,
        accountId: selected.accountId,
        to: body.to,
        upstream,
      });
    }

    return json({ ok: false, error: "not found" }, 404);
  } catch (err) {
    return json({ ok: false, error: String(err?.message || err) }, 500);
  }
}
