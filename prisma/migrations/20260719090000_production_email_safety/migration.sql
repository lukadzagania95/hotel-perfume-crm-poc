-- Add safe test/live delivery metadata and idempotency controls.
ALTER TABLE "EmailTemplate" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "EmailLog" ADD COLUMN "intendedRecipientEmail" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "deliveryMode" TEXT NOT NULL DEFAULT 'TEST';
ALTER TABLE "EmailLog" ADD COLUMN "dedupeKey" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");
CREATE INDEX "EmailLog_hotelId_emailTemplateId_deliveryMode_sentAt_idx"
  ON "EmailLog"("hotelId", "emailTemplateId", "deliveryMode", "sentAt");
CREATE INDEX "EmailLog_status_createdAt_idx" ON "EmailLog"("status", "createdAt");
CREATE INDEX "IncomingEmail_hotelId_receivedAt_idx"
  ON "IncomingEmail"("hotelId", "receivedAt");
CREATE INDEX "IncomingEmail_status_receivedAt_idx"
  ON "IncomingEmail"("status", "receivedAt");
