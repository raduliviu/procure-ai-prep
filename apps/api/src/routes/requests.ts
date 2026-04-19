import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, type SQL } from "drizzle-orm";
import { z } from "zod";
import {
	CreateRequestBodySchema,
	DecisionBodySchema,
	ListRequestsQuerySchema,
	type TriageResult,
} from "@procure/shared";
import { db } from "../db/client.js";
import { purchaseRequests } from "../db/schema.js";
import { triageRequest } from "../services/triage.js";

export const requestsRouter = new Hono();

/** Validate route params once so we don't reach the DB on malformed ids. */
const IdParamSchema = z.object({ id: z.uuid() });

/**
 * Shape the triage result for the `set` side of a Drizzle update. Used
 * by both the create-and-triage flow and the re-run endpoint, keeping
 * the mapping (LLM number → DB numeric string, etc.) in one place.
 */
function triageUpdatePayload(triage: TriageResult) {
	return {
		status: "triaged" as const,
		triageCategory: triage.category,
		// numeric(12,2) is returned by postgres.js as a string, and
		// Drizzle happily accepts strings here too. Using toFixed(2)
		// keeps precision predictable regardless of what the LLM sent.
		triageEstimatedAmount: triage.estimatedAmount.toFixed(2),
		triageCurrency: triage.currency,
		triageUrgency: triage.urgency,
		triageSuggestedVendors: triage.suggestedVendors,
		triageConfidence: triage.confidence,
		triageReasoning: triage.reasoning,
	};
}

/**
 * POST /api/requests
 * Create a new request and run triage inline. If triage succeeds, the
 * returned row is already in status=triaged with all fields populated;
 * if it fails, the row is still created with status=submitted and the
 * user can retry via POST /:id/triage. We never fail the create just
 * because the LLM is unhappy.
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
	const row = inserted[0];
	if (!row) {
		// Drizzle types .returning() as possibly empty; in practice insert
		// always produces one row here. Guard so we don't reach into undefined.
		return c.json({ error: "Failed to create request" }, 500);
	}

	try {
		const triage = await triageRequest(rawText);
		const updated = await db
			.update(purchaseRequests)
			.set(triageUpdatePayload(triage))
			.where(eq(purchaseRequests.id, row.id))
			.returning();
		return c.json(updated[0] ?? row, 201);
	} catch (err) {
		console.error("Triage failed on create:", err);
		// Leave the row as status=submitted and return it — the client
		// still gets a valid PurchaseRequest and can re-run triage.
		return c.json(row, 201);
	}
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

/**
 * POST /api/requests/:id/triage
 * Re-run the LLM triage on an existing request. Used for retrying a
 * failed initial triage or refreshing the extraction after an edit.
 * Only allowed on requests in submitted or triaged status — once
 * approved/rejected, the triage fields are effectively frozen.
 */
requestsRouter.post("/:id/triage", zValidator("param", IdParamSchema), async (c) => {
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

	if (row.status !== "submitted" && row.status !== "triaged") {
		return c.json(
			{
				error: `Cannot re-triage a ${row.status} request; the decision has already been made.`,
			},
			409,
		);
	}

	try {
		const triage = await triageRequest(row.rawText);
		const updated = await db
			.update(purchaseRequests)
			.set(triageUpdatePayload(triage))
			.where(eq(purchaseRequests.id, id))
			.returning();
		return c.json(updated[0] ?? row);
	} catch (err) {
		const message = err instanceof Error ? err.message : "unknown error";
		return c.json({ error: `Triage failed: ${message}` }, 502);
	}
});

/**
 * POST /api/requests/:id/decision
 * Approve or reject a triaged request. Only approvers can call this;
 * only requests currently in `triaged` status can transition.
 */
requestsRouter.post(
	"/:id/decision",
	zValidator("param", IdParamSchema),
	zValidator("json", DecisionBodySchema),
	async (c) => {
		const { id } = c.req.valid("param");
		const { decision, note } = c.req.valid("json");
		const user = c.get("user");

		if (user.role !== "approver") {
			return c.json({ error: "Only approvers can decide" }, 403);
		}

		const existing = await db
			.select()
			.from(purchaseRequests)
			.where(eq(purchaseRequests.id, id))
			.limit(1);
		const row = existing[0];
		if (!row) {
			return c.json({ error: "Not found" }, 404);
		}

		if (row.status !== "triaged") {
			return c.json(
				{
					error: `Cannot decide a ${row.status} request; only triaged requests can be approved or rejected.`,
				},
				409,
			);
		}

		const updated = await db
			.update(purchaseRequests)
			.set({
				status: decision,
				decisionBy: user.id,
				decisionNote: note ?? null,
				decidedAt: new Date(),
			})
			.where(eq(purchaseRequests.id, id))
			.returning();

		return c.json(updated[0]);
	},
);
