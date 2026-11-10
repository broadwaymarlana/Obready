import { sql } from "drizzle-orm";
import { boolean, index, jsonb, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  stripeCustomerId: varchar("stripe_customer_id"),
  stripeSubscriptionId: varchar("stripe_subscription_id"),
  subscriptionStatus: varchar("subscription_status"),
  // Bar membership
  barNumber: varchar("bar_number"),
  barState: varchar("bar_state").default("LA"),
  barParish: varchar("bar_parish"),
  barCaptureCompleted: boolean("bar_capture_completed").default(false),
  parish: varchar("parish"),
  onboardingCompleted: varchar("onboarding_completed").default("false"),
  activatedAt: timestamp("activated_at"),
  // TOTP 2FA
  totpSecret: text("totp_secret"),
  totpEnabled: boolean("totp_enabled").default(false),
  totpRecoveryCodes: text("totp_recovery_codes"),
  // Extended profile fields
  firmName: varchar("firm_name"),
  phone: varchar("phone"),
  // Save-on-cancel tracking
  cancelOfferShownAt: timestamp("cancel_offer_shown_at"),
  cancelOfferResponse: varchar("cancel_offer_response"), // "accepted" | "declined" | null
  cancelOfferRespondedAt: timestamp("cancel_offer_responded_at"),
  // Soft-delete flag
  deletedAt: timestamp("deleted_at"),
  // Retention fields
  emailPrefsLifecycle: boolean("email_prefs_lifecycle").default(true),
  paymentStatus: varchar("payment_status"), // 'ok' | 'failed'
  trialStartedAt: timestamp("trial_started_at"),
  cancelledAt: timestamp("cancelled_at"),
  nextLifecycleEmailAt: timestamp("next_lifecycle_email_at"),
  lastLifecycleEmailSent: varchar("last_lifecycle_email_sent"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit log table — records security-relevant events per user
export const auditLog = pgTable(
  "audit_log",
  {
    id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id").notNull(),
    eventType: varchar("event_type", { length: 80 }).notNull(),
    ipAddress: varchar("ip_address", { length: 64 }),
    userAgent: text("user_agent"),
    resourceId: text("resource_id"),
    resourceType: varchar("resource_type", { length: 60 }),
    details: text("details"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("IDX_audit_log_user_id").on(table.userId),
    index("IDX_audit_log_created_at").on(table.createdAt),
  ]
);

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AuditLogEntry = typeof auditLog.$inferSelect;
export type InsertAuditLog = typeof auditLog.$inferInsert;
