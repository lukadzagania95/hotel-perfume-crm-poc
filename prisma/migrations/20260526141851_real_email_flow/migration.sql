-- AlterTable
ALTER TABLE "EmailLog" ADD COLUMN "errorMessage" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "fromEmail" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "providerMessageId" TEXT;
ALTER TABLE "EmailLog" ADD COLUMN "sentAt" DATETIME;

-- CreateTable
CREATE TABLE "IncomingEmail" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "opportunityId" TEXT,
    "providerMessageId" TEXT,
    "fromEmail" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "roomLabel" TEXT,
    "intent" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "actionSummary" TEXT NOT NULL,
    "errorMessage" TEXT,
    "receivedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "IncomingEmail_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "IncomingEmail_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "IncomingEmail_providerMessageId_key" ON "IncomingEmail"("providerMessageId");
