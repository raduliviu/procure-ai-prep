import { db } from "./client.js";
import { users } from "./schema.js";

// These IDs MUST match apps/web/src/lib/users.ts so the Requester / Approver
// buttons in the Header map to real rows via the `x-user-id` mock-auth header.
// They're syntactically valid v4 UUIDs (version=4, variant=8) so Zod's
// strict z.uuid() accepts them.
const REQUESTER_ID = "11111111-1111-4111-8111-111111111111";
const APPROVER_ID = "22222222-2222-4222-8222-222222222222";

async function seed() {
	const inserted = await db
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

	console.log(`Seed complete. New users inserted: ${inserted.length}`);
}

try {
	await seed();
	process.exit(0);
} catch (err) {
	console.error("Seed failed:", err);
	process.exit(1);
}
