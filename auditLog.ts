import { db } from "./db";
import { auditLog } from "@shared/models/auth";
import { eq, desc, and, gte, lte, lt } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import type { Request } from "express";

export type AuditEventType =
  | "login"
  | "login_2fa_success"
  | "login_2fa_failure"
  | "logout"
  | "2fa_enabled"
  | "2fa_disabled"
  | "2fa_recovery_used"
  | "bar_profile_updated"
  | "document_upload"
  | "document_download"
  | "case_export"
  | "subscription_changed"
  | "password_changed"
  | "profile_updated";

export interface EmitAuditOptions {
  userId: string;
  eventType: AuditEventType;
  req?: Request;
  ipAddress?: string;
  userAgent?: string;
  resourceId?: string;
  resourceType?: string;
  details?: Record<string, unknown> | string;
}

function extractIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (forwarded) {
    const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    return ips.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

export async function emitAudit(opts: EmitAuditOptions): Promise<void> {
  try {
    const ip = opts.ipAddress ?? (opts.req ? extractIp(opts.req) : "unknown");
    const ua = opts.userAgent ?? opts.req?.headers["user-agent"] ?? null;
    await db.insert(auditLog).values({
      id: uuidv4(),
      userId: opts.userId,
      eventType: opts.eventType,
      ipAddress: ip,
      userAgent: ua,
      resourceId: opts.resourceId ?? null,
      resourceType: opts.resourceType ?? null,
      details: opts.details == null
        ? null
        : typeof opts.details === "string"
          ? opts.details
          : JSON.stringify(opts.details),
    });
  } catch (err) {
    console.error("[AuditLog] Failed to write audit event:", err);
  }
}

export interface AuditLogFilter {
  eventType?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export async function getUserAuditLog(userId: string, filter: AuditLogFilter = {}) {
  const page = Math.max(1, filter.page || 1);
  const pageSize = Math.min(100, Math.max(10, filter.pageSize || 25));
  const offset = (page - 1) * pageSize;

  const conditions: any[] = [eq(auditLog.userId, userId)];

  if (filter.eventType) {
    conditions.push(eq(auditLog.eventType, filter.eventType as any));
  }
  if (filter.startDate) {
    conditions.push(gte(auditLog.createdAt, new Date(filter.startDate)));
  }
  if (filter.endDate) {
    const end = new Date(filter.endDate);
    end.setHours(23, 59, 59, 999);
    conditions.push(lte(auditLog.createdAt, end));
  }

  const where = conditions.length > 1 ? and(...conditions) : conditions[0];

  const [rows, countRows] = await Promise.all([
    db
      .select()
      .from(auditLog)
      .where(where)
      .orderBy(desc(auditLog.createdAt))
      .limit(pageSize)
      .offset(offset),
    db.select({ id: auditLog.id }).from(auditLog).where(where),
  ]);

  return {
    entries: rows,
    total: countRows.length,
    page,
    pageSize,
    totalPages: Math.ceil(countRows.length / pageSize),
  };
}

export async function purgeOldAuditLogs(retentionDays = 90): Promise<number> {
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000);
  try {
    const deleted = await db
      .delete(auditLog)
      .where(lt(auditLog.createdAt, cutoff))
      .returning({ id: auditLog.id });
    if (deleted.length > 0) {
      console.log(
        `[AuditLog] Purged ${deleted.length} audit log entries older than ${retentionDays} days`,
      );
    }
    return deleted.length;
  } catch (err) {
    console.error("[AuditLog] Failed to purge old audit log entries:", err);
    return 0;
  }
}

let purgeInterval: NodeJS.Timeout | null = null;

export function scheduleAuditLogPurge(retentionDays = 90): void {
  if (purgeInterval) return;
  void purgeOldAuditLogs(retentionDays);
  const DAY_MS = 24 * 60 * 60 * 1000;
  purgeInterval = setInterval(() => {
    void purgeOldAuditLogs(retentionDays);
  }, DAY_MS);
  if (typeof purgeInterval.unref === "function") {
    purgeInterval.unref();
  }
}
