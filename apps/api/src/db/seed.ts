import { db } from './client.js';
import { users } from './schema.js';

// These IDs MUST match apps/web/src/lib/users.ts so the Requester / Approver
// buttons in the Header map to real rows via the `x-user-id` mock-auth header.
const REQUESTER_ID = '00000000-0000-0000-0000-000000000001';
const APPROVER_ID = '00000000-0000-0000-0000-000000000002';

async function seed() {
    const inserted = await db
        .insert(users)
        .values([
            {
                id: REQUESTER_ID,
                name: 'Rebecca Requester',
                email: 'rebecca@example.com',
                role: 'requester',
            },
            {
                id: APPROVER_ID,
                name: 'Alex Approver',
                email: 'alex@example.com',
                role: 'approver',
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
    console.error('Seed failed:', err);
    process.exit(1);
}
