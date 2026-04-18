import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema.js";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
	throw new Error("DATABASE_URL is not set — copy .env.example to .env at the repo root.");
}

// postgres.js manages its own connection pool internally (default: max 10).
// Reusing one module-level client gives us a process-wide singleton for free
// via Node's module caching.
const queryClient = postgres(connectionString);

// Passing `schema` enables Drizzle's relational query API
// (db.query.users.findMany({ with: { ... } })) in addition to the core
// builders (db.select(), db.insert(), db.update(), db.delete()).
export const db = drizzle(queryClient, { schema });
