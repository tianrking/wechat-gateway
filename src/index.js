import { handleAdmin } from "./routes/admin.js";
import { handleApi } from "./routes/api.js";
import { renderDocsUi } from "./routes/docs.js";
import { renderAdminUi, renderAdminUiScript } from "./routes/ui.js";
import { runPollCycle } from "./services/poller.js";
import { requireAdmin } from "./utils/auth.js";
import { errMessage, json } from "./utils/common.js";

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);

      if (request.method === "GET" && url.pathname === "/health") {
        return json({ ok: true, service: "cf-wechat-worker", now: new Date().toISOString() });
      }

      if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/admin-ui")) {
        return renderAdminUi();
      }

      if (request.method === "GET" && url.pathname === "/docs") {
        return renderDocsUi();
      }

      if (request.method === "GET" && url.pathname === "/admin-ui.js") {
        return renderAdminUiScript(String(env.UI_LOGIN_REQUIRED || "").toLowerCase() === "true");
      }

      if (url.pathname.startsWith("/admin/") || url.pathname.startsWith("/api/")) {
        if (!requireAdmin(request, env)) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }
        if (url.pathname.startsWith("/admin/")) return handleAdmin(request, env);
        return handleApi(request, env);
      }

      return json({ ok: false, error: "not found" }, 404);
    } catch (err) {
      console.error("request failed", err);
      return json({ ok: false, error: errMessage(err) }, 500);
    }
  },

  async scheduled(_event, env) {
    const results = await runPollCycle(env, null);
    console.log("scheduled poll", JSON.stringify(results));
  },
};
