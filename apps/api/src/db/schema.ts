import {
    jsonb,
    numeric,
    pgEnum,
    pgTable,
    real,
    text,
    timestamp,
    uuid,
} from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['requester', 'approver']);

export const requestStatusEnum = pgEnum('request_status', [
    'submitted',
    'triaged',
    'approved',
    'rejected',
]);

export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    role: userRoleEnum('role').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export type SuggestedVendor = { name: string; reason: string };

export const purchaseRequests = pgTable('purchase_requests', {
    id: uuid('id').primaryKey().defaultRandom(),
    requesterId: uuid('requester_id')
        .references(() => users.id)
        .notNull(),
    rawText: text('raw_text').notNull(),
    status: requestStatusEnum('status').default('submitted').notNull(),

    // Triage fields — null until the LLM has run on the request.
    triageCategory: text('triage_category'),
    triageEstimatedAmount: numeric('triage_estimated_amount', { precision: 12, scale: 2 }),
    triageCurrency: text('triage_currency'),
    triageUrgency: text('triage_urgency'),
    triageSuggestedVendors: jsonb('triage_suggested_vendors').$type<SuggestedVendor[]>(),
    triageConfidence: real('triage_confidence'),
    triageReasoning: text('triage_reasoning'),

    // Decision fields — null until an approver has acted on the request.
    decisionBy: uuid('decision_by').references(() => users.id),
    decisionNote: text('decision_note'),
    decidedAt: timestamp('decided_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});

// Inferred row types for use across the API code.
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PurchaseRequest = typeof purchaseRequests.$inferSelect;
export type NewPurchaseRequest = typeof purchaseRequests.$inferInsert;
