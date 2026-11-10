-- Backfill bar_capture_completed for users who already have a bar_number on file.
-- Without this, attorneys who entered their bar profile before bar_capture_completed
-- existed (or had it default to NULL/false) would be re-prompted on next login.
UPDATE "users"
SET "bar_capture_completed" = true
WHERE "bar_number" IS NOT NULL
  AND "bar_number" <> ''
  AND ("bar_capture_completed" IS NULL OR "bar_capture_completed" = false);
