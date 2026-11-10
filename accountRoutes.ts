import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "../shared/models/auth";
import { cases, supportTickets } from "../shared/schema";
import { eq, inArray, sql } from "drizzle-orm";
import { ObjectStorageService } from "./replit_integrations/object_storage";
import { isAuthenticated } from "./replit_integrations/auth";
import { getUncachableStripeClient } from "./stripeClient";
import { captureError } from "./sentry";
import { v4 as uuidv4 } from "uuid";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const archiver = require("archiver");

const CANCEL_OFFER_COOLDOWN_DAYS = 30;

export function registerAccountRoutes(app: Express) {

  // POST /api/support/contact — persist support ticket, message stored in DB
  app.post("/api/support/contact", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const { category, subject, metadata } = req.body;
      const message: string = req.body.message ?? "";

      if (typeof message !== "string" || message.trim().length < 5) {
        return res.status(400).json({ error: "Message is required (min 5 characters)" });
      }
      if (message.length > 2000) {
        return res.status(400).json({ error: "Message too long (max 2000 characters)" });
      }

      const validCategories = ["general", "bug", "billing", "feature", "data"];
      const safeCategory = validCategories.includes(category) ? category : "general";
      const safeSubject = typeof subject === "string" ? subject.trim().slice(0, 120) : "Support Request";
      const safePage = typeof metadata?.currentPage === "string" ? metadata.currentPage.slice(0, 200) : null;
      const safePlan = typeof metadata?.plan === "string" ? metadata.plan.slice(0, 50) : null;

      await db.insert(supportTickets).values({
        id: uuidv4(),
        userId,
        category: safeCategory,
        subject: safeSubject,
        message: message.trim(),
        currentPage: safePage,
        plan: safePlan,
        status: "open",
      });

      console.log(`[support] Ticket created — user=${userId} category=${safeCategory}`);
      res.json({ ok: true });
    } catch (err) {
      captureError(err, { route: "POST /api/support/contact" });
      res.status(500).json({ error: "Failed to submit support request" });
    }
  });

  // GET /api/account/profile — return extended profile
  app.get("/api/account/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "User not found" });
      const { stripeCustomerId, stripeSubscriptionId, deletedAt, ...safe } = rows[0];
      res.json(safe);
    } catch (err) {
      captureError(err, { route: "GET /api/account/profile" });
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  // PATCH /api/account/profile — update profile fields
  app.patch("/api/account/profile", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const allowed = ["firstName", "lastName", "email", "barNumber", "barState", "firmName", "phone"];
      const updates: Record<string, any> = {};
      for (const key of allowed) {
        if (key in req.body && typeof req.body[key] === "string") {
          updates[key] = req.body[key].trim().slice(0, 500) || null;
        }
      }
      if (!Object.keys(updates).length) {
        return res.status(400).json({ error: "No valid fields to update" });
      }
      updates.updatedAt = new Date();

      await db.update(users).set(updates).where(eq(users.id, userId));
      const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const { stripeCustomerId, stripeSubscriptionId, deletedAt, ...safe } = rows[0];
      res.json(safe);
    } catch (err) {
      captureError(err, { route: "PATCH /api/account/profile" });
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // POST /api/account/cancel-offer-response — record accept/decline with cooldown check
  app.post("/api/account/cancel-offer-response", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const response = req.body?.response;
      if (response !== "accepted" && response !== "declined") {
        return res.status(400).json({ error: "response must be 'accepted' or 'declined'" });
      }

      const now = new Date();
      await db.update(users).set({
        cancelOfferShownAt: now,
        cancelOfferResponse: response,
        cancelOfferRespondedAt: now,
        updatedAt: now,
      }).where(eq(users.id, userId));
      res.json({ ok: true });
    } catch (err) {
      captureError(err, { route: "POST /api/account/cancel-offer-response" });
      res.status(500).json({ error: "Failed to record response" });
    }
  });

  // GET /api/account/cancel-offer-status — check if offer should be shown (cooldown logic)
  app.get("/api/account/cancel-offer-status", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;
      const rows = await db.select({
        cancelOfferResponse: users.cancelOfferResponse,
        cancelOfferRespondedAt: users.cancelOfferRespondedAt,
      }).from(users).where(eq(users.id, userId)).limit(1);

      if (!rows.length) return res.json({ showOffer: true });

      const { cancelOfferResponse, cancelOfferRespondedAt } = rows[0];

      if (cancelOfferRespondedAt) {
        const daysSinceResponse = (Date.now() - new Date(cancelOfferRespondedAt).getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceResponse < CANCEL_OFFER_COOLDOWN_DAYS) {
          return res.json({ showOffer: false, lastResponse: cancelOfferResponse, daysSinceResponse: Math.floor(daysSinceResponse) });
        }
      }

      res.json({ showOffer: true });
    } catch (err) {
      captureError(err, { route: "GET /api/account/cancel-offer-status" });
      res.status(500).json({ error: "Failed to check offer status" });
    }
  });

  // GET /api/account/export — download case data + uploaded files as zip
  app.get("/api/account/export", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;

      const { dbStorage } = await import("./dbStorage");
      const userCases = await dbStorage.getCases(userId);

      const caseData = await Promise.all(
        userCases.map(async (c) => {
          const [witnessRows, evidenceRows, timelineRows, weaknessRows, docRows] = await Promise.all([
            dbStorage.getWitnesses(c.id),
            dbStorage.getEvidence(c.id),
            dbStorage.getTimeline(c.id),
            dbStorage.getWeaknesses(c.id),
            dbStorage.getDocuments(c.id),
          ]);
          return {
            ...c,
            rawContent: undefined,
            witnesses: witnessRows,
            evidence: evidenceRows,
            timeline: timelineRows,
            weaknesses: weaknessRows,
            documents: (docRows as any[]).map((d) => ({
              id: d.id,
              title: d.title,
              type: d.type,
              createdAt: d.createdAt,
              objectPath: d.objectPath,
            })),
          };
        })
      );

      const userRow = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        barNumber: users.barNumber,
        barState: users.barState,
        firmName: users.firmName,
        createdAt: users.createdAt,
      }).from(users).where(eq(users.id, userId)).limit(1);

      const exportPayload = {
        exportedAt: new Date().toISOString(),
        exportVersion: "2",
        user: userRow[0] || null,
        cases: caseData,
      };

      const filename = `objectionready-export-${new Date().toISOString().slice(0, 10)}.zip`;
      res.setHeader("Content-Type", "application/zip");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

      const archive = archiver("zip", { zlib: { level: 6 } });
      archive.on("error", (err: any) => {
        captureError(err, { route: "GET /api/account/export", phase: "archiver" });
      });
      archive.pipe(res);

      archive.append(JSON.stringify(exportPayload, null, 2), { name: "cases.json" });

      const storage = new ObjectStorageService();
      const allDocs = caseData.flatMap((c) => (c.documents as any[]).map((d) => ({ ...d, caseId: c.id })));
      const exportErrors: string[] = [];
      for (const doc of allDocs) {
        if (doc.objectPath) {
          try {
            const file = await storage.getFileByStoredPath(doc.objectPath);
            const stream = file.createReadStream();
            const safeName = `documents/${doc.caseId}/${doc.id}-${(doc.title || "file").replace(/[^a-zA-Z0-9._-]/g, "_")}`;
            archive.append(stream, { name: safeName });
          } catch (fileErr: any) {
            exportErrors.push(doc.objectPath);
            console.error(`[export] File not included in export: ${doc.objectPath} — ${fileErr?.message}`);
          }
        }
      }

      if (exportErrors.length > 0) {
        const summary = JSON.stringify({ partialExport: true, filesNotIncluded: exportErrors.length }, null, 2);
        archive.append(summary, { name: "export-warnings.json" });
      }

      await archive.finalize();
    } catch (err) {
      captureError(err, { route: "GET /api/account/export" });
      if (!res.headersSent) {
        res.status(500).json({ error: "Export failed" });
      }
    }
  });

  // DELETE /api/account — anonymize user; cancel Stripe first (blocking)
  app.delete("/api/account", isAuthenticated, async (req: any, res: Response) => {
    try {
      const userId = req.user?.claims?.sub as string;

      if (userId === "demo-user-001") {
        return res.status(403).json({ error: "Demo account cannot be deleted" });
      }

      const userRow = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      const user = userRow[0];
      if (!user) return res.status(404).json({ error: "User not found" });

      // Step 1: Cancel all Stripe subscriptions — covers active, trialing, past_due, unpaid
      if (user.stripeCustomerId) {
        try {
          const stripe = await getUncachableStripeClient();
          const CANCELLABLE = new Set(["active", "trialing", "past_due", "unpaid", "paused"]);

          // Prefer direct cancel via stored subscriptionId; also sweep for any others
          const subscriptionIds = new Set<string>();
          if (user.stripeSubscriptionId) {
            subscriptionIds.add(user.stripeSubscriptionId);
          }
          const list = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 20 });
          for (const sub of list.data) {
            if (CANCELLABLE.has(sub.status)) subscriptionIds.add(sub.id);
          }

          for (const subId of subscriptionIds) {
            try {
              const sub = await stripe.subscriptions.retrieve(subId);
              if (CANCELLABLE.has(sub.status)) {
                await stripe.subscriptions.cancel(subId);
              }
            } catch (subErr: any) {
              const isGone = subErr?.code === "resource_missing" || subErr?.statusCode === 404;
              if (!isGone) throw subErr;
            }
          }
        } catch (stripeErr: any) {
          captureError(stripeErr, { route: "DELETE /api/account", phase: "stripe_cancel", userId });
          return res.status(500).json({ error: "Failed to cancel Stripe subscription. Please contact support." });
        }
      }

      // Step 2: Collect all user case IDs and delete object-storage files (blocking)
      const { dbStorage } = await import("./dbStorage");
      const userCases = await dbStorage.getCases(userId);
      const caseIds = userCases.map((c) => c.id);
      const storage = new ObjectStorageService();
      const storageErrors: string[] = [];

      if (caseIds.length > 0) {
        const docRows = await db.execute<{ object_path: string }>(
          sql`SELECT object_path FROM documents WHERE case_id = ANY(${caseIds}) AND object_path IS NOT NULL`
        );
        const docRows2 = await db.execute<{ object_path: string }>(
          sql`SELECT object_path FROM case_documents WHERE case_id = ANY(${caseIds}) AND object_path IS NOT NULL`
        );
        const docRows3 = await db.execute<{ object_path: string }>(
          sql`SELECT object_path FROM video_evidence WHERE case_id = ANY(${caseIds}) AND object_path IS NOT NULL`
        );
        const allPaths = [
          ...((docRows as any).rows ?? docRows).map((r: any) => r.object_path),
          ...((docRows2 as any).rows ?? docRows2).map((r: any) => r.object_path),
          ...((docRows3 as any).rows ?? docRows3).map((r: any) => r.object_path),
        ].filter(Boolean);

        for (const objectPath of allPaths) {
          try {
            await storage.deleteFileByStoredPath(objectPath);
          } catch (fileErr: any) {
            storageErrors.push(objectPath);
            captureError(fileErr, { route: "DELETE /api/account", phase: "storage_delete", path: objectPath });
          }
        }
      }

      if (storageErrors.length > 0) {
        console.error(`[account-delete] Storage cleanup failed for ${storageErrors.length} file(s). Aborting deletion.`);
        return res.status(500).json({
          error: "Account deletion failed: some uploaded files could not be removed. Please contact support.",
          storageErrorCount: storageErrors.length,
        });
      }

      // Step 3: Delete ALL case-linked DB rows comprehensively using raw SQL
      // This covers every table with a case_id FK rather than selectively listing them
      if (caseIds.length > 0) {
        const CASE_LINKED_TABLES = [
          "video_frame_analysis", "video_frames", "video_evidence", "video_analysis_summary",
          "video_analysis_reports", "contradiction_reports", "contradictions",
          "outcome_simulations", "voir_dire_questions", "docket_alerts", "docket_monitors",
          "case_activity_log", "case_comments", "efiling_submissions", "expert_witnesses",
          "sentencing_predictions", "calendar_entries", "attorney_notes", "time_logs",
          "case_tasks", "case_assignments", "case_procedural_alerts",
          "action_items", "motion_recommendations", "case_phase_progress", "case_documents",
          "case_changes", "motion_tracking", "strategy_memory", "annotations",
          "search_consent_issues", "weaknesses", "timeline_events", "evidence_items",
          "witnesses", "documents",
        ];

        for (const table of CASE_LINKED_TABLES) {
          await db.execute(sql.raw(`DELETE FROM "${table}" WHERE case_id = ANY(ARRAY[${caseIds.map((id) => `'${id.replace(/'/g, "''")}'`).join(",")}]::varchar[])`));
        }
      }

      await db.delete(cases).where(eq(cases.userId, userId));
      await db.delete(supportTickets).where(eq(supportTickets.userId, userId));

      // Step 4: Anonymize user row (retain id for FK integrity)
      await db.update(users).set({
        email: null,
        firstName: null,
        lastName: null,
        profileImageUrl: null,
        barNumber: null,
        barState: null,
        firmName: null,
        phone: null,
        deletedAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(users.id, userId));

      console.log(`[account-delete] User ${userId} anonymized successfully.`);
      res.json({ ok: true, message: "Account deleted" });
    } catch (err) {
      captureError(err, { route: "DELETE /api/account" });
      res.status(500).json({ error: "Account deletion failed" });
    }
  });
}
