import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
	// Load env vars from the monorepo root .env so a single file drives
	// both the API (Node --env-file) and the Vite dev server.
	// Empty prefix ("") disables Vite's default VITE_-only filter for this
	// server-side read — we need API_PORT and WEB_PORT here, not VITE_* vars.
	const env = loadEnv(mode, "../..", "");
	const apiPort = env.API_PORT ?? "3001";
	const webPort = env.WEB_PORT ?? "5173";

	return {
		plugins: [react(), tailwindcss()],
		server: {
			port: Number(webPort),
			proxy: {
				// Any /api/* request in the browser is transparently forwarded to
				// the Hono server. Keeps the typed API client relative-URL-only and
				// avoids CORS setup entirely in dev.
				"/api": {
					target: `http://localhost:${apiPort}`,
					changeOrigin: true,
				},
			},
		},
	};
});
