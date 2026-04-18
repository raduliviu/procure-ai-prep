import type { MiddlewareHandler } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../db/client.js";
import { users, type User } from "../db/schema.js";

// Attach the `user` variable to Hono's context typings so `c.get('user')`
// is typed as User everywhere in the request pipeline.
declare module "hono" {
	interface ContextVariableMap {
		user: User;
	}
}

/**
 * Mock authentication — reads the `x-user-id` header, looks up the row
 * in the users table, and attaches it to the request context. Any route
 * mounted after this middleware can call `c.get('user')` to access the
 * authenticated user.
 *
 * This is deliberately not production auth. In a real app, replace with
 * JWT verification, session cookies, or whatever your identity layer is.
 */
export const requireUser: MiddlewareHandler = async (c, next) => {
	const userId = c.req.header("x-user-id");
	if (!userId) {
		return c.json({ error: "Missing x-user-id header" }, 401);
	}

	const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
	const user = rows[0];
	if (!user) {
		return c.json({ error: "Unknown user id" }, 401);
	}

	c.set("user", user);
	await next();
};
