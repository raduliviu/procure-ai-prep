import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { z } from "zod";
import { CreateRequestBodySchema, ListRequestsQuerySchema } from "@procure/shared";
import { db } from "../db/client.js";
import { purchaseRequests } from "../db/schema.js";

export const requestsRouter = new Hono();

/** Validate route params once so we don't reach the DB on malformed ids. */
const IdParamSchema = z.object({ id: z.uuid() });

/**
 * POST /api/requests
 * Create a new request with status='submitted'. Requester id is taken
 * from the authenticated user (mock auth), not the body — so a client
 * can't create a request on behalf of someone else.
 */
requestsRouter.post("/", zValidator("json", CreateRequestBodySchema), async (c) => {
	const { rawText } = c.req.valid("json");
	const user = c.get("user");

	const inserted = await db
		.insert(purchaseRequests)
		.values({
			requesterId: user.id,
			rawText,
		})
		.returning();

	return c.json(inserted[0], 201);
});

/**
 * GET /api/requests?status=...
 * List requests. Requesters see only their own; approvers see all.
 */
requestsRouter.get("/", zValidator("query", ListRequestsQuerySchema), async (c) => {
	const { status } = c.req.valid("query");
	const user = c.get("user");

	const conditions: SQL[] = [];
	if (user.role === "requester") {
		conditions.push(eq(purchaseRequests.requesterId, user.id));
	}
	if (status) {
		conditions.push(eq(purchaseRequests.status, status));
	}

	const rows = await db
		.select()
		.from(purchaseRequests)
		.where(conditions.length > 0 ? and(...conditions) : undefined)
		.orderBy(desc(purchaseRequests.createdAt));

	return c.json(rows);
});

/**
 * GET /api/requests/:id
 * Detail view. Requesters can only fetch their own (404 otherwise so we
 * don't leak existence); approvers can fetch anything.
 */
requestsRouter.get("/:id", zValidator("param", IdParamSchema), async (c) => {
	const { id } = c.req.valid("param");
	const user = c.get("user");

	const rows = await db
		.select()
		.from(purchaseRequests)
		.where(eq(purchaseRequests.id, id))
		.limit(1);
	const row = rows[0];

	if (!row || (user.role === "requester" && row.requesterId !== user.id)) {
		return c.json({ error: "Not found" }, 404);
	}

	return c.json(row);
});
