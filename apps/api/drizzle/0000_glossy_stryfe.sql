CREATE TYPE "public"."request_status" AS ENUM('submitted', 'triaged', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('requester', 'approver');--> statement-breakpoint
CREATE TABLE "purchase_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"requester_id" uuid NOT NULL,
	"raw_text" text NOT NULL,
	"status" "request_status" DEFAULT 'submitted' NOT NULL,
	"triage_category" text,
	"triage_estimated_amount" numeric(12, 2),
	"triage_currency" text,
	"triage_urgency" text,
	"triage_suggested_vendors" jsonb,
	"triage_confidence" real,
	"triage_reasoning" text,
	"decision_by" uuid,
	"decision_note" text,
	"decided_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_requester_id_users_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchase_requests" ADD CONSTRAINT "purchase_requests_decision_by_users_id_fk" FOREIGN KEY ("decision_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;