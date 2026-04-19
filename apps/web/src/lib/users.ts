/**
 * Placeholder user IDs for the mock-auth flow.
 *
 * These must be syntactically valid v4 UUIDs (version nibble=4,
 * variant nibble=8/9/a/b) because Zod v4's z.uuid() validates the
 * version bits — the lazy "00000000-...-000001" approach fails that
 * check. We use all-1s / all-2s with the correct 4-and-8 nibbles so
 * they're still easy to spot in logs.
 *
 * When step 4 seeds the database it inserts users with these exact
 * UUIDs so the role toggle maps to real rows.
 */
export const REQUESTER_ID = "11111111-1111-4111-8111-111111111111";
export const APPROVER_ID = "22222222-2222-4222-8222-222222222222";
