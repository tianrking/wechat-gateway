import { handleAdmin } from "./routes/admin.js";
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

      if (!url.pathname.startsWith("/admin/")) {
        return json({ ok: false, error: "not found" }, 404);
      }

      if (!requireAdmin(request, env)) {
        return json({ ok: false, error: "unauthorized" }, 401);
      }

      return handleAdmin(request, env);
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
