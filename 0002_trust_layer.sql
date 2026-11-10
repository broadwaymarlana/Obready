-- Trust layer: bar membership fields, TOTP 2FA fields, and audit log table
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bar_number" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bar_state" varchar DEFAULT 'LA';--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bar_parish" varchar;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "bar_capture_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_secret" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "totp_recovery_codes" text;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "audit_log" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" varchar NOT NULL,
  "event_type" varchar(80) NOT NULL,
  "ip_address" varchar(64),
  "user_agent" text,
  "resource_id" text,
  "resource_type" varchar(60),
  "details" text,
  "created_at" timestamp DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_audit_log_user_id" ON "audit_log" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "IDX_audit_log_created_at" ON "audit_log" ("created_at");
