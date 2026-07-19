-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EmailLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hotelId" TEXT NOT NULL,
    "templateType" TEXT,
    "emailTemplateId" TEXT,
    "templateLabel" TEXT NOT NULL,
    "recipientEmail" TEXT NOT NULL,
    "fromEmail" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "providerMessageId" TEXT,
    "errorMessage" TEXT,
    "sentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailLog_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_EmailLog" ("body", "createdAt", "errorMessage", "fromEmail", "hotelId", "id", "providerMessageId", "recipientEmail", "sentAt", "status", "subject", "templateLabel", "templateType") SELECT "body", "createdAt", "errorMessage", "fromEmail", "hotelId", "id", "providerMessageId", "recipientEmail", "sentAt", "status", "subject", "templateLabel", "templateType" FROM "EmailLog";
DROP TABLE "EmailLog";
ALTER TABLE "new_EmailLog" RENAME TO "EmailLog";
CREATE TABLE "new_EmailTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT,
    "label" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "frequencyDays" INTEGER NOT NULL DEFAULT 7,
    "triggerStatuses" TEXT NOT NULL DEFAULT '',
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_EmailTemplate" ("body", "createdAt", "id", "label", "subject", "type", "updatedAt") SELECT "body", "createdAt", "id", "label", "subject", "type", "updatedAt" FROM "EmailTemplate";
DROP TABLE "EmailTemplate";
ALTER TABLE "new_EmailTemplate" RENAME TO "EmailTemplate";
CREATE UNIQUE INDEX "EmailTemplate_type_key" ON "EmailTemplate"("type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
