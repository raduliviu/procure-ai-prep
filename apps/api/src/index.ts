import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono();

app.use(logger());

// Infrastructure-level probe at the root path. Not under /api, not
// proxied by the web app — intended for load balancers, uptime checks,
// container orchestrators, etc.
app.get("/health", (c) => c.json({ ok: true }));

// Everything the web app talks to lives under /api/*. In dev, Vite
// proxies /api/* on the web origin to this server. In prod, a reverse
// proxy (nginx, Cloudflare, etc.) would do the same.
const api = new Hono();
api.get("/health", (c) => c.json({ ok: true }));
app.route("/api", api);

const port = Number(process.env.API_PORT ?? 3001);

serve({ fetch: app.fetch, port }, (info) => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${info.port}`);
});
