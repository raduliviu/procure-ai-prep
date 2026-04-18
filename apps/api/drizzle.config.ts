import { defineConfig } from "drizzle-kit";

// Load the root .env so DATABASE_URL is available when drizzle-kit runs
// any of `generate`, `migrate`, or `studio`. `process.loadEnvFile` is
// native to Node 20.12+ — no dotenv dependency needed.
process.loadEnvFile("../../.env");

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL is not set. Copy .env.example to .env at the repo root.");
}

export default defineConfig({
	dialect: "postgresql",
	schema: "./src/db/schema.ts",
	out: "./drizzle",
	dbCredentials: { url: databaseUrl },
});
