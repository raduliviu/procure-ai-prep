import { z } from "zod";

// Mirror of the Postgres enum in apps/api/src/db/schema.ts
export const RequestStatusSchema = z.enum(["submitted", "triaged", "approved", "rejected"]);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

// Mirror of the user_role enum
export const UserRoleSchema = z.enum(["requester", "approver"]);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Shape of each entry in purchase_requests.triage_suggested_vendors
export const SuggestedVendorSchema = z.object({
	name: z.string(),
	reason: z.string(),
});
export type SuggestedVendor = z.infer<typeof SuggestedVendorSchema>;

// The API returns Drizzle rows mostly as-is. `numeric(12,2)` comes back
// from postgres.js as a string to preserve precision, so the money field
// is typed as a string here — the UI formats it for display.
export const PurchaseRequestSchema = z.object({
	id: z.uuid(),
	requesterId: z.uuid(),
	rawText: z.string(),
	status: RequestStatusSchema,

	triageCategory: z.string().nullable(),
	triageEstimatedAmount: z.string().nullable(),
	triageCurrency: z.string().nullable(),
	triageUrgency: z.string().nullable(),
	triageSuggestedVendors: z.array(SuggestedVendorSchema).nullable(),
	triageConfidence: z.number().nullable(),
	triageReasoning: z.string().nullable(),

	decisionBy: z.uuid().nullable(),
	decisionNote: z.string().nullable(),
	decidedAt: z.iso.datetime({ offset: true }).nullable(),

	createdAt: z.iso.datetime({ offset: true }),
	updatedAt: z.iso.datetime({ offset: true }),
});
export type PurchaseRequest = z.infer<typeof PurchaseRequestSchema>;

// GET /api/requests response
export const PurchaseRequestListSchema = z.array(PurchaseRequestSchema);

// POST /api/requests body
export const CreateRequestBodySchema = z.object({
	rawText: z.string().trim().min(1).max(5000),
});
export type CreateRequestBody = z.infer<typeof CreateRequestBodySchema>;

// GET /api/requests query params
export const ListRequestsQuerySchema = z.object({
	status: RequestStatusSchema.optional(),
});
export type ListRequestsQuery = z.infer<typeof ListRequestsQuerySchema>;

// POST /api/requests/:id/decision body
export const DecisionBodySchema = z.object({
	decision: z.enum(["approved", "rejected"]),
	note: z.string().trim().max(2000).optional(),
});
export type DecisionBody = z.infer<typeof DecisionBodySchema>;

// --- AI triage ---
// Fixed enum values the LLM must choose from. Keeping these centralised
// here means the API call, the DB shape, and the UI dropdowns stay
// in sync.

export const TriageCategorySchema = z.enum([
	"IT",
	"Office",
	"Marketing",
	"Travel",
	"Services",
	"Other",
]);
export type TriageCategory = z.infer<typeof TriageCategorySchema>;

export const UrgencySchema = z.enum(["low", "medium", "high"]);
export type Urgency = z.infer<typeof UrgencySchema>;

export const CurrencySchema = z.enum(["EUR", "GBP", "USD"]);
export type Currency = z.infer<typeof CurrencySchema>;

/**
 * The structured output the LLM produces for every triage call. The
 * entire shape is enforced by OpenAI's strict JSON-schema mode, then
 * re-validated server-side with Zod as a belt-and-suspenders check.
 */
export const TriageResultSchema = z.object({
	category: TriageCategorySchema,
	estimatedAmount: z.number().nonnegative(),
	currency: CurrencySchema,
	urgency: UrgencySchema,
	suggestedVendors: z.array(SuggestedVendorSchema).max(5),
	confidence: z.number().min(0).max(1),
	reasoning: z.string().max(500),
});
export type TriageResult = z.infer<typeof TriageResultSchema>;
