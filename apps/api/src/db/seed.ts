import { db } from "./client.js";
import { purchaseRequests, users, type NewPurchaseRequest } from "./schema.js";

// These IDs MUST match apps/web/src/lib/users.ts so the Requester / Approver
// buttons in the Header map to real rows via the `x-user-id` mock-auth header.
// They're syntactically valid v4 UUIDs (version=4, variant=8) so Zod's
// strict z.uuid() accepts them.
const REQUESTER_ID = "11111111-1111-4111-8111-111111111111";
const APPROVER_ID = "22222222-2222-4222-8222-222222222222";

/**
 * Demo purchase requests across every status so the queue is never
 * empty when someone clones and runs the project. Triage fields here
 * are hand-written (not LLM-generated) so the seed doesn't need an
 * OpenAI key and produces deterministic output.
 *
 * Decided rows use `decidedAt` values in the recent past to make the
 * timeline feel believable.
 */
function daysAgo(days: number): Date {
	const d = new Date();
	d.setDate(d.getDate() - days);
	return d;
}

const SEED_REQUESTS: NewPurchaseRequest[] = [
	{
		requesterId: REQUESTER_ID,
		rawText:
			"Need a new laptop, mine is 4 years old and the battery dies quickly. I mostly do JS/TS development and occasional design work.",
		status: "submitted",
	},
	{
		requesterId: REQUESTER_ID,
		rawText:
			"20 ergonomic chairs for the Paris office, budget around €6000. Replacements for the old IKEA ones that are wearing out.",
		status: "triaged",
		triageCategory: "Office",
		triageEstimatedAmount: "6000.00",
		triageCurrency: "EUR",
		triageUrgency: "medium",
		triageSuggestedVendors: [
			{
				name: "Herman Miller",
				reason: "Premium ergonomic chairs widely used in EU offices; good resale value.",
			},
			{
				name: "IKEA for Business",
				reason: "Cost-effective bulk office furniture with EU-wide delivery.",
			},
		],
		triageConfidence: 0.9,
		triageReasoning:
			"Explicit quantity, location, and budget make this a clear-cut office furniture request.",
	},
	{
		requesterId: REQUESTER_ID,
		rawText:
			"Annual Figma Enterprise license renewal for the design team — 8 seats. Current subscription expires end of month.",
		status: "triaged",
		triageCategory: "IT",
		triageEstimatedAmount: "5400.00",
		triageCurrency: "USD",
		triageUrgency: "high",
		triageSuggestedVendors: [
			{
				name: "Figma",
				reason: "Direct vendor renewal; no alternative since this is a product-specific license.",
			},
		],
		triageConfidence: 0.95,
		triageReasoning:
			"Renewal of an existing specific product with a deadline — vendor is fixed, price is predictable.",
	},
	{
		requesterId: REQUESTER_ID,
		rawText:
			"Team offsite in Lisbon next month, 15 people, need to book flights from Berlin + hotel for 3 nights.",
		status: "triaged",
		triageCategory: "Travel",
		triageEstimatedAmount: "12000.00",
		triageCurrency: "EUR",
		triageUrgency: "medium",
		triageSuggestedVendors: [
			{ name: "Egencia", reason: "Corporate travel with consolidated billing." },
			{
				name: "BCD Travel",
				reason: "Strong EU-corporate presence, policy enforcement built-in.",
			},
		],
		triageConfidence: 0.75,
		triageReasoning:
			"Group travel with specific dates and headcount; estimated cost depends heavily on hotel tier.",
	},
	{
		requesterId: REQUESTER_ID,
		rawText:
			"2-day React conference tickets for 3 engineers in Berlin in June, plus 2 nights at a nearby hotel.",
		status: "approved",
		triageCategory: "Travel",
		triageEstimatedAmount: "4800.00",
		triageCurrency: "EUR",
		triageUrgency: "low",
		triageSuggestedVendors: [
			{
				name: "React Summit",
				reason: "The reference React conference held annually in Berlin.",
			},
		],
		triageConfidence: 0.85,
		triageReasoning:
			"Clear headcount, venue, and duration — standard professional-development request.",
		decisionBy: APPROVER_ID,
		decisionNote: "Approved within training budget. Use Egencia for the hotel booking.",
		decidedAt: daysAgo(3),
	},
	{
		requesterId: REQUESTER_ID,
		rawText:
			"New espresso machine for the Hamburg office kitchen, the current one is always broken.",
		status: "approved",
		triageCategory: "Office",
		triageEstimatedAmount: "850.00",
		triageCurrency: "EUR",
		triageUrgency: "low",
		triageSuggestedVendors: [
			{
				name: "De'Longhi for Business",
				reason: "Reliable bean-to-cup model for small offices.",
			},
		],
		triageConfidence: 0.8,
		triageReasoning: "Small, well-defined facilities purchase.",
		decisionBy: APPROVER_ID,
		decisionNote: "Approved. Please coordinate with facilities for the install.",
		decidedAt: daysAgo(7),
	},
	{
		requesterId: REQUESTER_ID,
		rawText: "LinkedIn Sales Navigator Premium for 10 sales reps, annual subscription.",
		status: "rejected",
		triageCategory: "Services",
		triageEstimatedAmount: "9600.00",
		triageCurrency: "USD",
		triageUrgency: "low",
		triageSuggestedVendors: [
			{
				name: "LinkedIn",
				reason: "Direct vendor; no alternative for this specific product.",
			},
		],
		triageConfidence: 0.9,
		triageReasoning: "Standard SaaS subscription with clear pricing per seat.",
		decisionBy: APPROVER_ID,
		decisionNote:
			"Declining for now — please revisit in Q3 once we've evaluated the existing Apollo.io contract.",
		decidedAt: daysAgo(14),
	},
	{
		requesterId: REQUESTER_ID,
		rawText: "New standing desk for my home office.",
		status: "rejected",
		triageCategory: "Office",
		triageEstimatedAmount: "500.00",
		triageCurrency: "EUR",
		triageUrgency: "low",
		triageSuggestedVendors: [
			{
				name: "Flexispot",
				reason: "Budget-friendly height-adjustable desks, quick delivery.",
			},
		],
		triageConfidence: 0.6,
		triageReasoning:
			"Single-item personal office equipment request; vague on existing equipment situation.",
		decisionBy: APPROVER_ID,
		decisionNote:
			"The home-office budget was already used this year. Please submit again next fiscal year.",
		decidedAt: daysAgo(21),
	},
];

async function seed() {
	// Users: idempotent upsert. Safe to re-run without touching existing rows.
	const insertedUsers = await db
		.insert(users)
		.values([
			{
				id: REQUESTER_ID,
				name: "Rebecca Requester",
				email: "rebecca@example.com",
				role: "requester",
			},
			{
				id: APPROVER_ID,
				name: "Alex Approver",
				email: "alex@example.com",
				role: "approver",
			},
		])
		.onConflictDoNothing()
		.returning({ id: users.id });

	// Purchase requests: only seed if the table is empty. This keeps
	// re-runs safe for anyone who's created their own requests and
	// wants to re-run the seed to ensure users exist.
	const existing = await db.select({ id: purchaseRequests.id }).from(purchaseRequests).limit(1);
	let insertedRequests = 0;
	if (existing.length === 0) {
		const inserted = await db
			.insert(purchaseRequests)
			.values(SEED_REQUESTS)
			.returning({ id: purchaseRequests.id });
		insertedRequests = inserted.length;
	}

	console.log(
		`Seed complete. Users: +${insertedUsers.length}. Requests: +${insertedRequests}${
			existing.length > 0 ? " (table already populated, left alone)" : ""
		}.`,
	);
}

try {
	await seed();
	process.exit(0);
} catch (err) {
	console.error("Seed failed:", err);
	process.exit(1);
}
