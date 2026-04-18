/**
 * Placeholder user IDs for the mock-auth flow.
 *
 * When step 4 seeds the database, it inserts users with these exact UUIDs
 * so the role toggle maps to real rows. When reusing the scaffold for a
 * different product, regenerate these (e.g. `crypto.randomUUID()`) and
 * update the seed script to match.
 */
export const REQUESTER_ID = "00000000-0000-0000-0000-000000000001";
export const APPROVER_ID = "00000000-0000-0000-0000-000000000002";
