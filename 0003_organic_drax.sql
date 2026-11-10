ALTER TABLE "users" ADD COLUMN "email_prefs_lifecycle" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "payment_status" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "trial_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "next_lifecycle_email_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_lifecycle_email_sent" varchar;